import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@/lib/db';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Protect with internal secret (called by n8n)
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const provided = req.headers['x-internal-secret'];
  if (!internalSecret || provided !== internalSecret) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { reservationId } = req.body as { reservationId: number };

  if (!reservationId) {
    return res.status(400).json({ error: 'reservationId es obligatorio' });
  }

  try {
    const reservation = await queryOne(
      `SELECT id, total_price, deposit_paid, payment_status
       FROM reservations WHERE id = $1`,
      [reservationId]
    );

    if (!reservation) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const remaining = parseFloat(reservation.total_price || '0') - parseFloat(reservation.deposit_paid || '0');
    if (remaining <= 0) {
      return res.status(400).json({ error: 'La reserva ya está totalmente pagada' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    await query(
      `INSERT INTO payment_tokens (token, reservation_id, token_type, expires_at)
       VALUES ($1, $2, 'remaining_payment', $3)`,
      [token, reservationId, expiresAt]
    );

    const baseUrl = process.env.NEXTAUTH_URL || 'https://happyhub.es';
    const url = `${baseUrl}/pagar/${token}`;

    return res.status(200).json({ token, url, expiresAt });
  } catch (error: any) {
    console.error('Error creating payment token:', error);
    return res.status(500).json({ error: error.message || 'Error al crear el token' });
  }
}
