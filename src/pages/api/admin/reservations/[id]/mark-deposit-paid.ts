import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne, query } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';
import { sendEmail } from '@/lib/mailer';
import { buildReservationCode, depositReceivedEmail } from '@/lib/emailTemplates';

// El admin confirma que ha recibido la señal por Bizum (Stripe no admite Bizum).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const id = Number.parseInt(String(req.query.id), 10);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, error: 'ID de reserva inválido' });
  }

  try {
    const updated = await queryOne<{
      id: number;
      event_date: string;
      time_slot: string;
      deposit_amount: string | null;
      total_price: string | null;
      user_id: number | null;
    }>(
      `UPDATE reservations
       SET deposit_paid = COALESCE(deposit_amount, 0), payment_status = 'deposit_paid', status = 'confirmed', updated_at = NOW()
       WHERE id = $1 AND status = 'approved' AND COALESCE(payment_status, 'pending') NOT IN ('deposit_paid', 'fully_paid')
       RETURNING id, TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date, time_slot, deposit_amount, total_price, user_id`,
      [id]
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        error: 'Solo se puede marcar la señal en reservas aprobadas y pendientes de pago',
      });
    }

    await query(`UPDATE payment_tokens SET used = true WHERE reservation_id::text = $1::text AND token_type = 'deposit' AND used = false`, [String(id)]).catch(
      (err) => console.error('Error invalidating deposit token:', err)
    );

    let warning: string | undefined;
    const user = updated.user_id
      ? await queryOne<{ name: string | null; email: string | null }>('SELECT name, email FROM users WHERE id = $1', [updated.user_id])
      : null;
    if (user?.email) {
      const sent = await sendEmail({
        to: user.email,
        ...depositReceivedEmail({
          name: user.name || '',
          code: buildReservationCode(updated.event_date, id),
          date: updated.event_date,
          timeSlot: updated.time_slot,
          depositAmount: Number(updated.deposit_amount) || 0,
          totalPrice: Number(updated.total_price) || 0,
        }),
      });
      if (!sent) warning = 'Señal registrada, pero no se pudo enviar el email de confirmación al cliente';
    }

    return res.status(200).json({ success: true, warning });
  } catch (error) {
    console.error('Error marking deposit as paid:', error);
    return res.status(500).json({ success: false, error: 'Error al registrar la señal' });
  }
}
