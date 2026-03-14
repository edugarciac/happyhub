import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { stripe } from '@/lib/stripe';

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
    // First try the database reservations table
    const dbResult = await query(
      `SELECT id, name, email, event_type, event_date, time_slot, guests,
              extras, base_price, total_price, deposit_amount, payment_method,
              status, customer_message, created_at
       FROM reservations
       WHERE email = $1
       ORDER BY event_date DESC`,
      [userEmail]
    );

    if (dbResult.rows.length > 0) {
      const reservations = dbResult.rows.map((r: any) => ({
        id: r.id.toString(),
        reservationId: `HH-${r.id}`,
        date: r.event_date,
        timeSlot: r.time_slot,
        eventType: r.event_type,
        guests: r.guests,
        extras: r.extras || [],
        basePrice: parseFloat(r.base_price),
        totalPrice: parseFloat(r.total_price || r.base_price),
        depositAmount: parseFloat(r.deposit_amount || '0'),
        depositPaid: r.status === 'paid' ? parseFloat(r.deposit_amount || '0') : 0,
        paymentStatus: r.status === 'paid' ? 'paid' : 'unpaid',
        status: r.status || 'pending',
        message: r.customer_message || '',
        createdAt: r.created_at,
      }));

      return res.status(200).json({ total: reservations.length, reservations });
    }

    // Fallback to Stripe checkout sessions
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });

    const userSessions = sessions.data.filter(
      (s) => s.metadata?.email?.toLowerCase() === userEmail.toLowerCase()
        || s.customer_email?.toLowerCase() === userEmail.toLowerCase()
    );

    userSessions.sort((a, b) => {
      const dateA = a.metadata?.date ? new Date(a.metadata.date).getTime() : 0;
      const dateB = b.metadata?.date ? new Date(b.metadata.date).getTime() : 0;
      return dateB - dateA;
    });

    const reservations = userSessions.map((s) => ({
      id: s.id,
      reservationId: s.metadata?.reservationId || s.id,
      date: s.metadata?.date || null,
      timeSlot: s.metadata?.timeSlot || 'N/A',
      eventType: s.metadata?.eventType || 'N/A',
      guests: parseInt(s.metadata?.guests || '0'),
      extras: s.metadata?.extras ? s.metadata.extras.split(',').filter(Boolean) : [],
      basePrice: parseFloat(s.metadata?.basePrice || '0'),
      totalPrice: parseFloat(s.metadata?.totalPrice || '0'),
      depositAmount: parseFloat(s.metadata?.depositAmount || '0'),
      depositPaid: s.amount_total ? s.amount_total / 100 : 0,
      paymentStatus: s.payment_status,
      status: s.payment_status === 'paid' ? 'paid' : 'pending',
      message: s.metadata?.message || '',
      createdAt: new Date(s.created * 1000).toISOString(),
    }));

    return res.status(200).json({ total: reservations.length, reservations });
  } catch (error: any) {
    console.error('Error fetching user reservations:', error);
    return res.status(500).json({
      error: 'No se pudieron cargar tus reservas. Inténtalo de nuevo más tarde',
    });
  }
}
