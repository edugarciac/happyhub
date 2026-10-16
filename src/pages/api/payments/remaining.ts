import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { createCheckoutSession } from '@/lib/stripe';
import { ensureReservationFlowColumns } from '@/lib/reservationFlow';
import { SECURITY_DEPOSIT_AMOUNT } from '@/config/payments';

/**
 * Crea la sesión de pago de Stripe para:
 *  - la señal (enlace de tipo 'deposit'),
 *  - el día del evento (enlace de tipo 'remaining_payment'), en dos pasos:
 *      step 'remaining'        → cobro del resto (captura automática)
 *      step 'security_deposit' → bloqueo de la fianza de 150 € (captura manual / preautorización)
 * El resto y la fianza solo se pagan con tarjeta (Bizum solo para la señal).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reservationId, token, step } = req.body as {
    reservationId?: number;
    token?: string;
    step?: 'remaining' | 'security_deposit';
  };

  if (!reservationId && !token) {
    return res.status(400).json({ error: 'Se requiere reservationId o token' });
  }

  try {
    await ensureReservationFlowColumns();
    let reservation: any;
    let tokenType = 'remaining_payment';

    const reservationColumns = `r.status, r.id, r.total_price, r.deposit_paid, r.payment_status, r.event_date,
      r.time_slot, r.event_type, r.guests, r.deposit_amount, r.security_deposit_status`;

    if (token) {
      // Enlace sin necesidad de cuenta (email, WhatsApp o QR el día del evento)
      const paymentToken = await queryOne(
        `SELECT pt.token_type, ${reservationColumns},
                u.name as customer_name, u.email as customer_email, u.phone as customer_phone
         FROM payment_tokens pt
         JOIN reservations r ON pt.reservation_id::text = r.id::text
         LEFT JOIN users u ON r.user_id = u.id
         WHERE pt.token = $1 AND pt.used = false AND pt.expires_at > NOW()`,
        [token]
      );

      if (!paymentToken) {
        return res.status(404).json({ error: 'Enlace de pago no válido o caducado' });
      }
      tokenType = paymentToken.token_type || 'remaining_payment';
      reservation = {
        ...paymentToken,
        name: paymentToken.customer_name,
        email: paymentToken.customer_email,
        phone: paymentToken.customer_phone,
      };
      // Cliente sin cuenta: datos de la aceptación electrónica de los términos
      if (!reservation.email) {
        const acceptance = await queryOne<{ customer_name: string; customer_email: string; customer_phone: string | null }>(
          `SELECT customer_name, customer_email, customer_phone FROM contract_acceptances
           WHERE reservation_id = $1 ORDER BY id DESC LIMIT 1`,
          [reservation.id]
        ).catch(() => null);
        if (acceptance) {
          reservation.name = reservation.name || acceptance.customer_name;
          reservation.email = acceptance.customer_email;
          reservation.phone = reservation.phone || acceptance.customer_phone;
        }
      }
    } else {
      // Usuario con cuenta desde el área privada (solo pago del resto)
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.email) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      reservation = await queryOne(
        `SELECT ${reservationColumns}, u.name, u.email, u.phone
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
    const isDeposit = tokenType === 'deposit';
    const isSecurityDeposit = !isDeposit && step === 'security_deposit';
    let amount: number;

    if (isDeposit) {
      // Señal tras la aprobación: solo si sigue aprobada y sin pagar
      if (reservation.status !== 'approved') {
        return res.status(400).json({ error: 'Esta reserva ya no está pendiente de pago (cancelada o plazo vencido)' });
      }
      if (reservation.payment_status === 'deposit_paid' || reservation.payment_status === 'fully_paid') {
        return res.status(400).json({ error: 'La señal de esta reserva ya está pagada' });
      }
      amount = parseFloat(reservation.deposit_amount || '0');
      if (amount <= 0) {
        return res.status(400).json({ error: 'Esta reserva no tiene importe de señal' });
      }
    } else if (isSecurityDeposit) {
      if (reservation.status === 'cancelled' || reservation.status === 'rejected') {
        return res.status(400).json({ error: 'Esta reserva está cancelada' });
      }
      if (reservation.security_deposit_status === 'held') {
        return res.status(400).json({ error: 'La fianza de esta reserva ya está bloqueada' });
      }
      amount = SECURITY_DEPOSIT_AMOUNT;
    } else {
      amount = totalPrice - depositPaid;
      if (amount <= 0 || reservation.payment_status === 'fully_paid') {
        return res.status(400).json({ error: 'El resto de esta reserva ya está pagado' });
      }
    }

    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.host}`;
    const reservationIdStr = reservation.id.toString();
    const eventLabel = `Evento ${new Date(reservation.event_date).toLocaleDateString('es-ES')} — ${reservation.time_slot}`;
    const type = isDeposit ? 'deposit' : isSecurityDeposit ? 'security_deposit' : 'remaining';

    // Día del evento: tras cada paso se vuelve a la misma página para hacer el siguiente
    const successUrl = isDeposit
      ? `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservationIdStr}&type=deposit`
      : token
        ? `${baseUrl}/pagar/${token}?ok=${type}`
        : `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservationIdStr}&type=remaining`;

    const stripeSession = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: isDeposit
                ? 'Señal de la reserva — HappyHub'
                : isSecurityDeposit
                  ? 'Fianza (bloqueo temporal, no es un cobro) — HappyHub'
                  : 'Pago restante — HappyHub',
              description: isSecurityDeposit
                ? `${eventLabel}. Se retienen ${SECURITY_DEPOSIT_AMOUNT} € y se liberan tras revisar el espacio (máx. 7 días).`
                : eventLabel,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      successUrl,
      // Volver al mismo enlace si cancela
      cancelUrl: token ? `${baseUrl}/pagar/${token}` : `${baseUrl}/area-privada`,
      customerEmail: reservation.email || undefined,
      captureMethod: isSecurityDeposit ? 'manual' : undefined,
      description: isSecurityDeposit ? `Fianza reserva ${reservationIdStr}` : undefined,
      metadata: {
        reservationId: reservationIdStr,
        type,
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
        depositAmount: amount.toString(),
        message: '',
      },
    });

    if (!isSecurityDeposit) {
      await query(
        isDeposit
          ? `UPDATE reservations SET stripe_deposit_session_id = $1, updated_at = NOW() WHERE id = $2`
          : `UPDATE reservations SET stripe_remaining_session_id = $1, updated_at = NOW() WHERE id = $2`,
        [stripeSession.id, reservation.id]
      );
    }

    return res.status(200).json({ url: stripeSession.url });
  } catch (error: unknown) {
    console.error('Error creating payment session:', error);
    const message = error instanceof Error ? error.message : 'Error al crear sesión de pago';
    return res.status(500).json({ error: message });
  }
}
