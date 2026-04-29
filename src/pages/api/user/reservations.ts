import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const userEmail = session.user.email;

  try {
    // Query reservations via user_id JOIN
    const dbResult = await query(
      `SELECT r.id, r.event_date, r.time_slot, r.event_type, r.guests,
              r.total_price, r.deposit_paid, r.deposit_amount, r.payment_status, r.status,
              r.notes, r.google_calendar_event_id, r.created_at
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE u.email = $1
       ORDER BY r.event_date DESC`,
      [userEmail]
    );

    const reservations = dbResult.rows.map((r: any) => ({
      id: r.id.toString(),
      reservationId: `HH-${r.id}`,
      date: r.event_date,
      timeSlot: r.time_slot,
      eventType: r.event_type || '',
      guests: r.guests || 0,
      extras: [],
      basePrice: parseFloat(r.total_price || '0'),
      totalPrice: parseFloat(r.total_price || '0'),
      depositAmount: parseFloat(r.deposit_amount || '0'),
      depositPaid: parseFloat(r.deposit_paid || '0'),
      paymentStatus: r.payment_status || 'pending',
      status: r.status || 'pending',
      message: r.notes || '',
      createdAt: r.created_at,
    }));

    return res.status(200).json({ total: reservations.length, reservations });
  } catch (error: any) {
    console.error('Error fetching user reservations:', error);
    return res.status(500).json({
      error: 'No se pudieron cargar tus reservas. Inténtalo de nuevo más tarde',
    });
  }
}
