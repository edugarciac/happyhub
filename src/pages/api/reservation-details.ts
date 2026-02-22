import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session.metadata) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservation = {
      reservationId: session.metadata.reservationId,
      name: session.metadata.name,
      email: session.metadata.email || session.customer_email,
      phone: session.metadata.phone,
      date: session.metadata.date,
      timeSlot: session.metadata.timeSlot,
      guests: parseInt(session.metadata.guests || '0'),
      extras: session.metadata.extras ? session.metadata.extras.split(',') : [],
      eventType: session.metadata.eventType,
      basePrice: parseFloat(session.metadata.basePrice || '0'),
      totalPrice: parseFloat(session.metadata.totalPrice || '0'),
      depositAmount: parseFloat(session.metadata.depositAmount || '0'),
      message: session.metadata.message,
      paymentStatus: session.payment_status,
      stripeSessionId: session.id,
    };

    return res.status(200).json(reservation);
  } catch (error: any) {
    console.error('Error retrieving reservation details:', error);
    return res.status(500).json({
      error: error.message || 'Error retrieving reservation details',
    });
  }
}
