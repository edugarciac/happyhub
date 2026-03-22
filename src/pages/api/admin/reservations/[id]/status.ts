import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '../../../../../lib/db';
import { verifyAdminSession } from '../../../../../utils/adminAuth';
import { isValidTransition, ReservationStatus } from '../../../../../utils/reservationStatus';

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

    // Notify n8n for rejected/cancelled (delete calendar event + send email)
    let notificationWarning: string | undefined;
    if ((status === 'rejected' || status === 'cancelled') && process.env.N8N_WEBHOOK_CANCELLATION_URL) {
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
