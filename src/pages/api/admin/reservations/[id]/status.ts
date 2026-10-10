import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '../../../../../lib/db';
import { verifyAdminSession } from '../../../../../utils/adminAuth';
import { isValidTransition, ReservationStatus } from '../../../../../utils/reservationStatus';
import { isEmailConfigured, sendEmail } from '@/lib/mailer';
import { buildReservationCode, reservationApprovedEmail, reservationCancelledEmail } from '@/lib/emailTemplates';
import { createDepositPaymentLink, ensureReservationFlowColumns } from '@/lib/reservationFlow';
import { PAYMENT_WINDOW_HOURS } from '@/config/payments';
import { deleteCalendarEvent } from '@/lib/googleCalendar';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, error: 'ID de reserva invalido' });
  }

  const { status, cancellationReason } = req.body as { status: ReservationStatus; cancellationReason?: string };
  if (!status) {
    return res.status(400).json({ success: false, error: 'Se requiere el campo status' });
  }

  if (status === 'cancelled' && !cancellationReason) {
    return res.status(400).json({ success: false, error: 'Se requiere un motivo de cancelación' });
  }

  if (status === 'rejected' && !cancellationReason) {
    return res.status(400).json({ success: false, error: 'Se requiere un motivo de rechazo' });
  }

  try {
    const reservation = await queryOne<{ id: number; status: ReservationStatus }>(
      'SELECT id, status FROM reservations WHERE id = $1',
      [parseInt(id)]
    );

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    if (!isValidTransition(reservation.status, status)) {
      return res.status(400).json({
        success: false,
        error: 'Transicion de estado no permitida',
      });
    }

    let updated;
    if (status === 'cancelled') {
      updated = await queryOne(
        `UPDATE reservations SET status = $1, cancellation_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
        [status, cancellationReason, parseInt(id)]
      );
    } else if (status === 'approved') {
      // Aprobación: empieza el plazo para pagar la señal
      await ensureReservationFlowColumns();
      updated = await queryOne(
        `UPDATE reservations
         SET status = 'approved',
             admin_approved_by = $1,
             approved_at = CURRENT_TIMESTAMP,
             payment_due_at = NOW() + make_interval(hours => $2::int),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 RETURNING *`,
        [admin.email, PAYMENT_WINDOW_HOURS, parseInt(id)]
      );
    } else if (status === 'rejected') {
      updated = await queryOne(
        `UPDATE reservations SET status = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
        [status, cancellationReason, parseInt(id)]
      );
    } else {
      updated = await queryOne(
        `UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [status, parseInt(id)]
      );
    }

    let notificationWarning: string | undefined;

    // Aprobación: enlace de pago de la señal (tarjeta) / instrucciones de Bizum por email
    if (status === 'approved' && updated) {
      try {
        const info = await queryOne<{
          name: string | null;
          email: string | null;
          event_date: string;
          time_slot: string;
          deposit_amount: string | null;
          total_price: string | null;
          payment_method: string | null;
          payment_due_at: Date;
        }>(
          `SELECT u.name, u.email, TO_CHAR(r.event_date, 'YYYY-MM-DD') AS event_date, r.time_slot,
                  r.deposit_amount, r.total_price, r.payment_method, r.payment_due_at
           FROM reservations r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = $1`,
          [parseInt(id)]
        );
        if (!info?.email) {
          notificationWarning = 'Reserva aprobada, pero no tiene email de cliente: envíale el enlace de pago a mano';
        } else {
          const dueAt = new Date(info.payment_due_at);
          const payUrl = await createDepositPaymentLink(parseInt(id), dueAt);
          const sent = await sendEmail({
            to: info.email,
            ...reservationApprovedEmail({
              name: info.name || '',
              code: buildReservationCode(info.event_date, parseInt(id)),
              date: info.event_date,
              timeSlot: info.time_slot,
              depositAmount: Number(info.deposit_amount) || 0,
              totalPrice: Number(info.total_price) || 0,
              paymentMethod: info.payment_method || 'card',
              payUrl,
              dueAt,
            }),
          });
          if (!sent) notificationWarning = `Reserva aprobada, pero no se pudo enviar el email. Enlace de pago: ${payUrl}`;
        }
      } catch (err) {
        console.error('Error sending approval email:', err);
        notificationWarning = 'Reserva aprobada, pero falló el envío del enlace de pago';
      }
    }

    // Rechazo/cancelación: email al cliente y borrar el evento de Google Calendar
    if ((status === 'rejected' || status === 'cancelled') && isEmailConfigured()) {
      const info = await queryOne<{ name: string | null; email: string | null; event_date: string; time_slot: string; google_calendar_event_id: string | null }>(
        `SELECT u.name, u.email, TO_CHAR(r.event_date, 'YYYY-MM-DD') AS event_date, r.time_slot, r.google_calendar_event_id
         FROM reservations r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = $1`,
        [parseInt(id)]
      ).catch(() => null);

      if (info?.google_calendar_event_id) {
        await deleteCalendarEvent(info.google_calendar_event_id);
      }

      const sent = info?.email
        ? await sendEmail({
            to: info.email,
            ...reservationCancelledEmail({
              name: info.name || '',
              status,
              date: info.event_date,
              timeSlot: info.time_slot,
              reason: cancellationReason,
            }),
          })
        : false;
      if (!sent) notificationWarning = 'El estado se cambio pero no se pudo enviar el email al cliente';
    } else if ((status === 'rejected' || status === 'cancelled') && process.env.N8N_WEBHOOK_CANCELLATION_URL) {
      try {
        const n8nRes = await fetch(process.env.N8N_WEBHOOK_CANCELLATION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservationId: parseInt(id),
            status,
            reason: cancellationReason,
            reservation: updated,
          }),
        });
        if (!n8nRes.ok) {
          const n8nBody = await n8nRes.text();
          console.error('n8n webhook error:', n8nRes.status, n8nBody);
          notificationWarning = 'El estado se cambio pero no se pudo enviar el email al cliente';
        }
      } catch (err) {
        console.error('Error notifying n8n cancellation webhook:', err);
        notificationWarning = 'El estado se cambio pero no se pudo contactar con el servicio de notificaciones';
      }
    }

    return res.status(200).json({ success: true, reservation: updated, warning: notificationWarning });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    return res.status(500).json({ success: false, error: 'Error al cambiar el estado' });
  }
}
