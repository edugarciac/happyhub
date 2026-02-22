import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { days = '7' } = req.query;
  const daysAhead = parseInt(days as string);

  try {
    // Calculate date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysAhead);

    // Get all paid checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ['data.metadata'],
    });

    // Filter for reservations on the target date
    const upcomingReservations = sessions.data
      .filter((session) => {
        if (session.payment_status !== 'paid' || !session.metadata?.date) {
          return false;
        }

        const reservationDate = new Date(session.metadata.date);
        reservationDate.setHours(0, 0, 0, 0);

        // Check if the reservation is exactly 'daysAhead' days from now
        return reservationDate.getTime() === targetDate.getTime();
      })
      .map((session) => ({
        reservationId: session.metadata!.reservationId,
        name: session.metadata!.name,
        email: session.metadata!.email || session.customer_email,
        phone: session.metadata!.phone,
        date: session.metadata!.date,
        timeSlot: session.metadata!.timeSlot,
        guests: parseInt(session.metadata!.guests || '0'),
        eventType: session.metadata!.eventType,
        totalPrice: parseFloat(session.metadata!.totalPrice || '0'),
        depositAmount: parseFloat(session.metadata!.depositAmount || '0'),
        stripeSessionId: session.id,
      }));

    return res.status(200).json({
      targetDate: targetDate.toISOString(),
      daysAhead,
      count: upcomingReservations.length,
      reservations: upcomingReservations,
    });
  } catch (error: any) {
    console.error('Error fetching upcoming reservations:', error);
    return res.status(500).json({
      error: error.message || 'Error fetching reservations',
    });
  }
}
