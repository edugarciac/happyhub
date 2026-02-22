import type { NextApiRequest, NextApiResponse } from 'next';
import { createCheckoutSession } from '@/lib/stripe';
import crypto from 'crypto';

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

    // Validate required fields
    if (!body.name || !body.email || !body.phone || !body.date || !body.timeSlot) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (!body.depositAmount || body.depositAmount <= 0) {
      return res.status(400).json({ error: 'El importe del depósito no es válido' });
    }

    // Generate unique reservation ID
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const reservationId = `HH-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    // Format date for display
    const eventDate = new Date(body.date);
    const formattedDate = eventDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Build line item description
    const description = `Reserva ${formattedDate} - ${TIME_SLOT_LABELS[body.timeSlot]} - ${body.guests} invitados`;

    // Get base URL for success/cancel redirects
    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.host}`;

    // Create Stripe Checkout Session
    const session = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Señal de reserva HappyHub',
              description,
              images: [`${baseUrl}/images/happyhub-logo.png`],
            },
            unit_amount: Math.round(body.depositAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      successUrl: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservationId}`,
      cancelUrl: `${baseUrl}/booking/cancel?reservation_id=${reservationId}`,
      customerEmail: body.email,
      metadata: {
        reservationId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        eventType: body.eventType,
        date: body.date,
        timeSlot: body.timeSlot,
        guests: body.guests.toString(),
        extras: body.extras.join(','),
        basePrice: body.basePrice.toString(),
        totalPrice: body.totalPrice.toString(),
        depositAmount: body.depositAmount.toString(),
        message: body.message || '',
      },
    });

    // Also notify n8n about the pending reservation (optional, for tracking)
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        const axios = (await import('axios')).default;
        await axios.post(process.env.N8N_WEBHOOK_URL, {
          event: 'reservation_pending',
          reservationId,
          sessionId: session.id,
          ...body,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error notifying n8n about pending reservation:', error);
        // Don't fail the request if n8n notification fails
      }
    }

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
      reservationId,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({
      error: error.message || 'Error al crear la sesión de pago',
    });
  }
}
