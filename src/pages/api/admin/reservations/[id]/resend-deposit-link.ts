import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';
import { parseIntParam } from '@/lib/apiMiddleware';
import { sendEmail } from '@/lib/mailer';
import { buildReservationCode, reservationApprovedEmail } from '@/lib/emailTemplates';
import { createDepositPaymentLink, ensureReservationFlowColumns } from '@/lib/reservationFlow';
import { PAYMENT_WINDOW_HOURS } from '@/config/payments';

/**
 * Reenvía el enlace de pago de la señal de una reserva aprobada (p. ej. tras corregir el cliente):
 * anula los enlaces anteriores, abre un plazo nuevo y envía el email de aprobación al cliente actual.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }
  const id = parseIntParam(req.query.id);
  if (id === null) {
    return res.status(400).json({ success: false, error: 'ID de reserva inválido' });
  }

  try {
    await ensureReservationFlowColumns();
    const r = await queryOne<{
      payment_due_at: Date;
      event_date: string;
      time_slot: string;
      deposit_amount: string | null;
      total_price: string | null;
      payment_method: string | null;
      user_id: number | null;
    }>(
      `UPDATE reservations
       SET payment_due_at = NOW() + make_interval(hours => $2::int), payment_reminder_sent_at = NULL, updated_at = NOW()
       WHERE id = $1 AND status = 'approved' AND COALESCE(payment_status, 'pending') NOT IN ('deposit_paid', 'fully_paid')
       RETURNING payment_due_at, TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date, time_slot, deposit_amount,
                 total_price, payment_method, user_id`,
      [id, PAYMENT_WINDOW_HOURS]
    );
    if (!r) {
      return res.status(400).json({ success: false, error: 'Solo se puede reenviar el enlace de la señal en reservas aprobadas sin la señal pagada' });
    }

    // El enlace anterior pudo llegar a otra persona: deja de servir
    await query(
      `UPDATE payment_tokens SET used = true WHERE reservation_id::text = $1::text AND token_type = 'deposit' AND used = false`,
      [String(id)]
    );
    const customer = r.user_id
      ? await queryOne<{ name: string | null; email: string | null }>('SELECT name, email FROM users WHERE id = $1', [r.user_id])
      : null;
    const dueAt = new Date(r.payment_due_at);
    const payUrl = await createDepositPaymentLink(id, dueAt);

    if (!customer?.email) {
      return res.status(200).json({ success: true, url: payUrl, warning: 'La reserva no tiene email de cliente: envíale el enlace por WhatsApp' });
    }
    const sent = await sendEmail({
      to: customer.email,
      ...reservationApprovedEmail({
        name: customer.name || '',
        code: buildReservationCode(r.event_date, id),
        date: r.event_date,
        timeSlot: r.time_slot,
        depositAmount: Number(r.deposit_amount) || 0,
        totalPrice: Number(r.total_price) || 0,
        paymentMethod: r.payment_method || 'card',
        payUrl,
        dueAt,
      }),
    });
    console.log(`Enlace de la señal de la reserva ${id} reenviado a ${customer.email} por ${admin.email}`);
    return res.status(200).json({
      success: true,
      url: payUrl,
      email: customer.email,
      warning: sent ? undefined : `No se pudo enviar el email a ${customer.email}: envíale el enlace por WhatsApp`,
    });
  } catch (error) {
    console.error('Error reenviando el enlace de la señal:', error);
    return res.status(500).json({ success: false, error: 'Error al reenviar el enlace de pago' });
  }
}
