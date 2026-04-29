import type { NextApiRequest, NextApiResponse } from 'next';
import { createCheckoutSession } from '@/lib/stripe';

interface CheckoutRequestBody {
  // Customer data
  name: string;
  email: string;
  phone: string;
  eventType: string;
  message?: string;
  // Booking data
  date: string;
  timeSlot: 'morning' | 'afternoon' | 'night';
  guests: number;
  extras: string[];
  // Pricing
  basePrice: number;
  totalPrice: number;
  depositAmount: number;
  // Payment type
  type: 'deposit' | 'remaining';
  // Reservation ID (required — caller must provide it)
  reservationId: string;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (11:00-14:30)',
  afternoon: 'Tarde (16:30-20:30)',
  night: 'Noche (22:00-02:00)',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as CheckoutRequestBody;

    if (!body.reservationId) {
      return res.status(400).json({ error: 'reservationId es obligatorio' });
    }

    if (!body.depositAmount || body.depositAmount <= 0) {
      return res.status(400).json({ error: 'El importe no es válido' });
    }

    const eventDate = new Date(body.date);
    const formattedDate = eventDate.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const isDeposit = body.type === 'deposit';
    const productName = isDeposit
      ? 'Paga y señal — HappyHub'
      : 'Pago restante — HappyHub';
    const description = `${formattedDate} — ${TIME_SLOT_LABELS[body.timeSlot] || body.timeSlot} — ${body.guests} invitados`;

    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.host}`;

    const session = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
              description,
            },
            unit_amount: Math.round(body.depositAmount * 100),
          },
          quantity: 1,
        },
      ],
      successUrl: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${body.reservationId}`,
      cancelUrl: `${baseUrl}/booking/cancel?reservation_id=${body.reservationId}`,
      customerEmail: body.email,
      metadata: {
        reservationId: body.reservationId,
        type: body.type || 'deposit',
        name: body.name || '',
        email: body.email || '',
        phone: body.phone || '',
        eventType: body.eventType || '',
        date: body.date || '',
        timeSlot: body.timeSlot || '',
        guests: (body.guests || 0).toString(),
        extras: (body.extras || []).join(','),
        basePrice: (body.basePrice || 0).toString(),
        totalPrice: (body.totalPrice || 0).toString(),
        depositAmount: (body.depositAmount || 0).toString(),
        message: body.message || '',
      },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: error.message || 'Error al crear la sesión de pago' });
  }
}
