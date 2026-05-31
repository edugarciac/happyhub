import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { createCheckoutSession } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reservationId, token } = req.body as { reservationId?: number; token?: string };

  if (!reservationId && !token) {
    return res.status(400).json({ error: 'Se requiere reservationId o token' });
  }

  try {
    let reservation: any;

    if (token) {
      // Token-based access (email link, non-registered user)
      const paymentToken = await queryOne(
        `SELECT pt.reservation_id as res_id, r.id, r.total_price, r.deposit_paid,
                r.payment_status, r.event_date, r.time_slot, r.event_type,
                r.guests, r.deposit_amount,
                u.name as customer_name, u.email as customer_email, u.phone as customer_phone
         FROM payment_tokens pt
         JOIN reservations r ON pt.reservation_id = r.id
         LEFT JOIN users u ON r.user_id = u.id
         WHERE pt.token = $1 AND pt.used = false AND pt.expires_at > NOW()`,
        [token]
      );

      if (!paymentToken) {
        return res.status(404).json({ error: 'Enlace de pago no válido o caducado' });
      }
      reservation = {
        id: paymentToken.id,
        total_price: paymentToken.total_price,
        deposit_paid: paymentToken.deposit_paid,
        payment_status: paymentToken.payment_status,
        event_date: paymentToken.event_date,
        time_slot: paymentToken.time_slot,
        event_type: paymentToken.event_type,
        guests: paymentToken.guests,
        deposit_amount: paymentToken.deposit_amount,
        name: paymentToken.customer_name,
        email: paymentToken.customer_email,
        phone: paymentToken.customer_phone,
      };
    } else {
      // Auth-based access (logged-in user from área privada)
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.email) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      reservation = await queryOne(
        `SELECT r.id, r.total_price, r.deposit_paid, r.payment_status,
                r.event_date, r.time_slot, r.event_type, r.guests, r.deposit_amount,
                u.name, u.email, u.phone
         FROM reservations r
         JOIN users u ON r.user_id = u.id
         WHERE r.id = $1 AND u.email = $2`,
        [reservationId, session.user.email]
      );

      if (!reservation) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }
    }

    const totalPrice = parseFloat(reservation.total_price || '0');
    const depositPaid = parseFloat(reservation.deposit_paid || '0');
    const remaining = totalPrice - depositPaid;

    if (remaining <= 0 || reservation.payment_status === 'fully_paid') {
      return res.status(400).json({ error: 'Esta reserva ya está totalmente pagada' });
    }

    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.host}`;
    const reservationIdStr = reservation.id.toString();

    const stripeSession = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Pago restante — HappyHub',
              description: `Evento ${new Date(reservation.event_date).toLocaleDateString('es-ES')} — ${reservation.time_slot}`,
            },
            unit_amount: Math.round(remaining * 100),
          },
          quantity: 1,
        },
      ],
      successUrl: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservationIdStr}&type=remaining`,
      cancelUrl: `${baseUrl}/area-privada`,
      customerEmail: reservation.email,
      metadata: {
        reservationId: reservationIdStr,
        type: 'remaining',
        name: reservation.name || '',
        email: reservation.email || '',
        phone: reservation.phone || '',
        eventType: reservation.event_type || '',
        date: reservation.event_date ? new Date(reservation.event_date).toISOString() : '',
        timeSlot: reservation.time_slot || '',
        guests: (reservation.guests || 0).toString(),
        extras: '',
        basePrice: totalPrice.toString(),
        totalPrice: totalPrice.toString(),
        depositAmount: remaining.toString(),
        message: '',
      },
    });

    // Save session ID to reservation
    await query(
      `UPDATE reservations SET stripe_remaining_session_id = $1, updated_at = NOW() WHERE id = $2`,
      [stripeSession.id, reservation.id]
    );

    return res.status(200).json({ url: stripeSession.url });
  } catch (error: unknown) {
    console.error('Error creating remaining payment session:', error);
    const message = error instanceof Error ? error.message : 'Error al crear sesión de pago';
    return res.status(500).json({ error: message });
  }
}
