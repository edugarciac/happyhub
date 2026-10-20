import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne, query } from '@/lib/db';
import { parseReservationCode } from '@/utils/reservationCode';

// Called when a user cancels Stripe checkout for a pending_deposit reservation.
// No auth required — reservation must be in pending_deposit status (not yet confirmed).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reservationId } = req.body as { reservationId: string };

  const dbId = parseReservationCode(reservationId);
  if (!dbId) {
    return res.status(400).json({ error: 'reservationId requerido' });
  }

  try {
    const reservation = await queryOne(
      `SELECT id, status, payment_status
       FROM reservations
       WHERE id = $1`,
      [dbId]
    );

    if (!reservation) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Only cancel if still pending payment — prevent accidental cancellation of paid reservations
    if (reservation.payment_status !== 'pending_deposit' && reservation.payment_status !== 'pending') {
      return res.status(400).json({ error: 'La reserva no está en estado pendiente de pago' });
    }

    await query(
      `UPDATE reservations
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1`,
      [reservation.id]
    );

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('cancel-pending error:', error);
    return res.status(500).json({ error: error.message || 'Error al cancelar' });
  }
}
