import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { query } from '../../../../../lib/db';
import { verifyAdminSession } from '../../../../../utils/adminAuth';
import { ensureReservationFlowColumns } from '../../../../../lib/reservationFlow';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const admin = await verifyAdminSession(req, res);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, error: 'ID de reserva inválido' });
    }

    const reservationId = parseInt(id);
    if (isNaN(reservationId)) {
      return res.status(400).json({ success: false, error: 'ID de reserva inválido' });
    }

    await ensureReservationFlowColumns();
    const result = await query<{ id: number; total_price: string; deposit_paid: string; security_deposit_status: string | null }>(
      'SELECT id, total_price, deposit_paid, security_deposit_status FROM reservations WHERE id = $1',
      [reservationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    const reservation = result.rows[0];
    const totalPrice = parseFloat(reservation.total_price || '0');
    const depositPaid = parseFloat(reservation.deposit_paid || '0');
    const remaining = totalPrice - depositPaid;

    // Enlace del día del evento: resto (si queda) + bloqueo de la fianza
    if (remaining <= 0 && reservation.security_deposit_status === 'held') {
      return res.status(400).json({ success: false, error: 'El resto está pagado y la fianza ya está bloqueada' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    await query(
      'INSERT INTO payment_tokens (token, reservation_id, token_type, expires_at) VALUES ($1, $2, $3, $4)',
      [token, reservationId, 'remaining_payment', expiresAt]
    );

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = `${baseUrl}/pagar/${token}`;

    return res.status(200).json({ success: true, token, url });
  } catch (error) {
    console.error('Error generating payment link:', error);
    return res.status(500).json({ success: false, error: 'Error al generar enlace de pago' });
  }
}
