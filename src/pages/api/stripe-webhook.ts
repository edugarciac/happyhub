import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { constructWebhookEvent, stripe } from '@/lib/stripe';
import { ensureReservationFlowColumns } from '@/lib/reservationFlow';
import { stripeDeclineMessage } from '@/utils/stripeErrors';
import { query, queryOne } from '@/lib/db';
import { getAdminEmails, sendEmail } from '@/lib/mailer';
import { buildReservationCode, depositReceivedEmail } from '@/lib/emailTemplates';
import {
  sendReservationConfirmation,
  notifyAdminNewReservation,
} from '@/lib/whatsapp';
import { parseReservationCode } from '@/utils/reservationCode';

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
        await query(
          `UPDATE reservations
           SET deposit_paid = total_price,
               payment_status = 'fully_paid',
               stripe_remaining_session_id = $1,
               last_payment_error = NULL,
               updated_at = NOW()
           WHERE id = $2`,
          [session.id, dbId]
        );
        // Mark payment token as used
        await query(
          `UPDATE payment_tokens SET used = true
           WHERE reservation_id::text = $1::text AND used = false`,
          [String(dbId)]
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
