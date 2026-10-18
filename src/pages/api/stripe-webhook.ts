import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { constructWebhookEvent, stripe } from '@/lib/stripe';
import { ensureReservationFlowColumns } from '@/lib/reservationFlow';
import { stripeDeclineMessage } from '@/utils/stripeErrors';
import { query, queryOne } from '@/lib/db';
import { getAdminEmails, sendEmail } from '@/lib/mailer';
import { buildReservationCode, depositReceivedEmail, escapeHtml, extraChargePaidEmail } from '@/lib/emailTemplates';
import { ensureReservationChargesTable, getChargeReservation } from '@/lib/reservationCharges';
import { chargeConceptLabel } from '@/utils/charges';
import {
  sendReservationConfirmation,
  notifyAdminNewReservation,
} from '@/lib/whatsapp';
import { parseReservationCode } from '@/utils/reservationCode';
import { SECURITY_DEPOSIT_ONLINE_HOLD_DAYS } from '@/config/payments';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      console.error('No se encontró la firma de Stripe');
      return res.status(400).json({ error: 'No signature provided' });
    }

    // Ensure signature is a string (headers can be string or string[])
    const signatureStr = Array.isArray(signature) ? signature[0] : signature;

    const event = constructWebhookEvent(buf.toString(), signatureStr);

    console.log('Evento de Stripe recibido:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Pago exitoso:', paymentIntent.id);
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Pago fallido:', failedPayment.id);
        await handlePaymentFailure(failedPayment);
        break;

      case 'payment_intent.canceled':
        // Bloqueo de fianza liberado o caducado (Stripe cancela la autorización al vencer)
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Sesión de checkout completada:', session.id);
        await handleCheckoutComplete(session, req.headers.host);
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error procesando webhook de Stripe:', error);
    return res.status(400).json({ error: error.message });
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  console.log('Procesando pago exitoso:', {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    customer: paymentIntent.customer,
    metadata: paymentIntent.metadata,
  });
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const reason = stripeDeclineMessage(paymentIntent.last_payment_error);
  console.log('Procesando pago fallido:', { id: paymentIntent.id, reason, metadata: paymentIntent.metadata });

  // El número de reserva viaja en los metadatos del PaymentIntent (payment_intent_data);
  // para sesiones antiguas se busca en la sesión de Checkout asociada.
  let code: string | undefined = paymentIntent.metadata?.reservationId;
  if (!code) {
    try {
      const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent.id, limit: 1 });
      code = sessions.data[0]?.metadata?.reservationId;
    } catch (err) {
      console.error('No se pudo buscar la sesión de Checkout del pago fallido:', err);
    }
  }

  const dbId = parseReservationCode(code);
  if (!dbId) {
    console.error(`Pago rechazado sin reserva asociada (PaymentIntent ${paymentIntent.id}): ${reason}`);
    return;
  }

  await ensureReservationFlowColumns();
  await query(
    `UPDATE reservations SET last_payment_error = $1, last_payment_error_at = NOW(), updated_at = NOW() WHERE id = $2`,
    [reason, dbId]
  );
  console.log(`Pago rechazado registrado en la reserva ${dbId}: ${reason}`);
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  if (paymentIntent.metadata?.type !== 'security_deposit') return;
  await ensureReservationFlowColumns();
  // Si lo liberó el admin ya está en 'released'; si sigue 'held', es que ha caducado
  const updated = await queryOne<{ id: number }>(
    `UPDATE reservations
     SET security_deposit_status = 'expired', security_deposit_resolved_at = NOW(), updated_at = NOW()
     WHERE security_deposit_payment_intent = $1 AND security_deposit_status = 'held'
     RETURNING id`,
    [paymentIntent.id]
  );
  if (updated) console.log(`Fianza caducada sin capturar en la reserva ${updated.id} (${paymentIntent.id})`);
}

/** Bloqueo de la fianza completado en Stripe Checkout (captura manual). */
async function handleSecurityDepositHold(session: Stripe.Checkout.Session, dbId: number) {
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) {
    console.error(`CRITICAL: sesión de fianza ${session.id} sin PaymentIntent (reserva ${dbId})`);
    return;
  }
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] });
  if (pi.status !== 'requires_capture') {
    console.error(`Fianza de la reserva ${dbId}: estado inesperado ${pi.status} (${pi.id})`);
    return;
  }
  const charge = pi.latest_charge && typeof pi.latest_charge !== 'string' ? pi.latest_charge : null;
  const captureBefore = (charge?.payment_method_details?.card as { capture_before?: number } | undefined)?.capture_before;
  const expiresAt = captureBefore
    ? new Date(captureBefore * 1000)
    : new Date(Date.now() + SECURITY_DEPOSIT_ONLINE_HOLD_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `UPDATE reservations
     SET security_deposit_status = 'held',
         security_deposit_method = 'card_link',
         security_deposit_payment_intent = $1,
         security_deposit_amount_held = $2,
         security_deposit_held_at = NOW(),
         security_deposit_expires_at = $3,
         security_deposit_captured = NULL,
         security_deposit_resolved_at = NULL,
         last_payment_error = NULL,
         updated_at = NOW()
     WHERE id = $4`,
    [pi.id, pi.amount_capturable / 100, expiresAt.toISOString(), dbId]
  );
  // Resto pagado + fianza bloqueada: el enlace del día ya no hace falta
  await query(
    `UPDATE payment_tokens SET used = true
     WHERE reservation_id::text = $1::text AND token_type = 'remaining_payment' AND used = false
       AND EXISTS (SELECT 1 FROM reservations WHERE id = $2 AND payment_status = 'fully_paid')`,
    [String(dbId), dbId]
  );
  console.log(`✅ Fianza bloqueada en la reserva ${dbId} hasta ${expiresAt.toISOString()} (${pi.id})`);
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session, host?: string | string[]) {
  console.log('Procesando checkout completado:', {
    id: session.id,
    customer: session.customer,
    paymentStatus: session.payment_status,
    metadata: session.metadata,
  });

  const metadata = session.metadata;
  if (!metadata?.reservationId) {
    console.log('No reservation metadata found in session');
    return;
  }

  const reservationId = metadata.reservationId;
  const paymentType = metadata.type || 'deposit';
  const amount = session.amount_total ? session.amount_total / 100 : 0;

  // metadata.reservationId es el código RES-YYYYMMDD-NNN (o el id numérico en enlaces de pago del admin)
  const dbId = parseReservationCode(reservationId);
  if (!dbId) {
    console.error(
      `CRITICAL: Unknown reservation code "${reservationId}" in Stripe session ${session.id} (${paymentType}, ${amount} EUR). Manual reconciliation required.`
    );
  }

  if (paymentType === 'extra_charge') {
    try {
      await handleExtraChargePaid(session, amount);
    } catch (err) {
      console.error(`CRITICAL: no se pudo registrar el cobro adicional ${metadata.chargeId} (sesión ${session.id}, ${amount} EUR)`, err);
    }
    return; // sin avisos de WhatsApp de nueva reserva
  }

  if (dbId && paymentType === 'security_deposit') {
    try {
      await ensureReservationFlowColumns();
      await handleSecurityDepositHold(session, dbId);
    } catch (err) {
      console.error(`CRITICAL: no se pudo registrar la fianza de la reserva ${dbId} (sesión ${session.id})`, err);
    }
    return; // sin avisos de WhatsApp: no es un pago
  }

  // Stripe reintenta y el admin puede reenviar eventos: si esta sesión ya está registrada,
  // no se repiten el registro, los correos ni los WhatsApp
  if (dbId && (paymentType === 'deposit' || paymentType === 'remaining')) {
    const column = paymentType === 'deposit' ? 'stripe_deposit_session_id' : 'stripe_remaining_session_id';
    await ensureReservationFlowColumns();
    const already = await queryOne(`SELECT 1 FROM reservations WHERE id = $1 AND ${column} = $2`, [dbId, session.id]);
    if (already) {
      console.log(`Sesión ${session.id} (${paymentType}) ya registrada en la reserva ${dbId}: evento repetido, se ignora`);
      return;
    }
  }

  if (dbId) {
    try {
      if (paymentType === 'deposit') {
        await query(
          `UPDATE reservations
           SET deposit_paid = $1,
               payment_status = 'deposit_paid',
               status = CASE WHEN status = 'approved' THEN 'confirmed' ELSE status END,
               stripe_deposit_session_id = $2,
               last_payment_error = NULL,
               updated_at = NOW()
           WHERE id = $3`,
          [amount, session.id, dbId]
        );
        // El enlace de pago de la señal ya no sirve
        await query(
          `UPDATE payment_tokens SET used = true WHERE reservation_id::text = $1::text AND token_type = 'deposit' AND used = false`,
          [String(dbId)]
        );
        // Correo de confirmación al cliente
        const info = await queryOne<{ status: string; event_date: string; time_slot: string; deposit_amount: string | null; total_price: string | null; name: string | null; email: string | null }>(
          `SELECT r.status, TO_CHAR(r.event_date, 'YYYY-MM-DD') AS event_date, r.time_slot, r.deposit_amount, r.total_price, u.name, u.email
           FROM reservations r LEFT JOIN users u ON u.id = r.user_id WHERE r.id = $1`,
          [dbId]
        );
        if (info && info.status !== 'confirmed') {
          // Pagó cuando la reserva ya no estaba aprobada (p. ej. cancelada por plazo vencido): revisar a mano
          console.error(`CRITICAL: deposit paid for reservation ${dbId} in status "${info.status}" (Stripe session ${session.id}, ${amount} EUR)`);
          await sendEmail({
            to: getAdminEmails(),
            subject: `⚠️ Señal pagada en una reserva ${info.status} (${buildReservationCode(info.event_date, dbId)})`,
            html: `<p>Se ha cobrado una señal de <strong>${amount} €</strong> (sesión de Stripe ${session.id}) para la reserva <strong>${buildReservationCode(info.event_date, dbId)}</strong>, pero su estado es <strong>${info.status}</strong>.</p><p>Revisa si la franja sigue libre para reactivarla o devuelve el pago desde Stripe.</p>`,
          });
        } else if (info?.email) {
          await sendEmail({
            to: info.email,
            ...depositReceivedEmail({
              name: info.name || '',
              code: buildReservationCode(info.event_date, dbId),
              date: info.event_date,
              timeSlot: info.time_slot,
              depositAmount: Number(info.deposit_amount) || amount,
              totalPrice: Number(info.total_price) || 0,
            }),
          });
        }
      } else if (paymentType === 'remaining') {
        await ensureReservationFlowColumns();
        await query(
          `UPDATE reservations
           SET deposit_paid = total_price,
               payment_status = 'fully_paid',
               remaining_payment_method = 'card_link',
               stripe_remaining_session_id = $1,
               last_payment_error = NULL,
               updated_at = NOW()
           WHERE id = $2`,
          [session.id, dbId]
        );
        // El enlace del día sigue activo hasta bloquear la fianza (paso 2); si ya está bloqueada, se cierra.
        // El enlace del recordatorio previo (remaining_advance) solo cobra el resto: se cierra siempre.
        await query(
          `UPDATE payment_tokens SET used = true
           WHERE reservation_id::text = $1::text AND used = false
             AND (token_type = 'remaining_advance'
                  OR EXISTS (SELECT 1 FROM reservations WHERE id = $2 AND security_deposit_status = 'held'))`,
          [String(dbId), dbId]
        );
      }
      console.log(`✅ DB updated for ${paymentType} payment, reservation ${reservationId}`);
    } catch (dbError) {
      console.error(
        `CRITICAL: Failed to update DB after ${paymentType} payment for reservation ${reservationId}. ` +
        `Stripe session ${session.id}, amount ${amount}. Manual reconciliation required.`,
        dbError
      );
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL || `https://${Array.isArray(host) ? host[0] : host}`;
  const contractUrl = `${baseUrl}/api/contracts/${metadata.reservationId}`;

  // Send WhatsApp confirmation to customer
  if (metadata.phone) {
    try {
      await sendReservationConfirmation({
        phone: metadata.phone,
        name: metadata.name || 'Cliente',
        date: metadata.date || '',
        timeSlot: metadata.timeSlot || '',
        guests: parseInt(metadata.guests || '0'),
        totalPrice: parseFloat(metadata.totalPrice || '0'),
        depositAmount: parseFloat(metadata.depositAmount || '0'),
        reservationId: metadata.reservationId,
        contractUrl,
      });
      console.log('WhatsApp confirmation sent to customer');
    } catch (error) {
      console.error('Error sending WhatsApp confirmation:', error);
    }
  }

  // Send WhatsApp notification to admin
  try {
    await notifyAdminNewReservation({
      name: metadata.name || 'Cliente',
      date: metadata.date || '',
      timeSlot: metadata.timeSlot || '',
      guests: parseInt(metadata.guests || '0'),
      totalPrice: parseFloat(metadata.totalPrice || '0'),
      depositAmount: parseFloat(metadata.depositAmount || '0'),
      reservationId: metadata.reservationId,
    });
    console.log('WhatsApp notification sent to admin');
  } catch (error) {
    console.error('Error sending admin WhatsApp notification:', error);
  }
}

/** Cobro adicional pagado con su enlace: se marca pagado (una sola vez) y se avisa al cliente y al admin */
async function handleExtraChargePaid(session: Stripe.Checkout.Session, amount: number) {
  await ensureReservationChargesTable();
  const chargeId = parseInt(session.metadata?.chargeId || '');
  const charge = await queryOne<{ reservation_id: number; concept: string; hours: number | null; description: string; prev_status: string }>(
    `WITH prev AS (SELECT id, status FROM reservation_charges WHERE id = $1)
     UPDATE reservation_charges c
     SET status = 'paid', paid_at = NOW(), paid_method = 'card', stripe_session_id = $2
     FROM prev
     WHERE c.id = prev.id AND c.status <> 'paid'
     RETURNING c.reservation_id, c.concept, c.hours, c.description, prev.status AS prev_status`,
    [chargeId, session.id]
  );
  if (!charge) {
    console.log(`Cobro adicional ${chargeId} ya registrado o inexistente (sesión ${session.id})`);
    return;
  }

  const reservation = await getChargeReservation(charge.reservation_id);
  const code = reservation ? buildReservationCode(reservation.event_date, reservation.id) : String(charge.reservation_id);
  const concept = chargeConceptLabel(charge);
  console.log(`✅ Cobro adicional ${chargeId} pagado: ${concept}, ${amount} EUR, reserva ${code}`);

  if (reservation?.email) {
    await sendEmail({
      to: reservation.email,
      ...extraChargePaidEmail({ name: reservation.name || '', code, date: reservation.event_date, concept, amount }),
    });
  }
  const warning = charge.prev_status === 'cancelled' ? ' ⚠️ El cobro estaba ANULADO: revisa si hay que devolverlo desde Stripe.' : '';
  await sendEmail({
    to: getAdminEmails(),
    subject: `💶 Cobro adicional pagado: ${concept} (${amount} €) - ${code}`,
    html: `<p>El cliente${reservation?.name ? ` <strong>${escapeHtml(reservation.name)}</strong>` : ''} ha pagado <strong>${amount} €</strong> por <strong>${escapeHtml(concept)}</strong> de la reserva <strong>${code}</strong> (sesión de Stripe ${escapeHtml(session.id)}).${warning}</p>`,
  });
}
