import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe';
import {
  sendReservationConfirmation,
  notifyAdminNewReservation,
} from '@/lib/whatsapp';

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

  if (paymentIntent.metadata?.reservationId && process.env.N8N_WEBHOOK_URL) {
    try {
      const axios = require('axios');
      await axios.post(process.env.N8N_WEBHOOK_URL, {
        event: 'payment_success',
        reservationId: paymentIntent.metadata.reservationId,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error notificando a n8n:', error);
    }
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  console.log('Procesando pago fallido:', {
    id: paymentIntent.id,
    lastPaymentError: paymentIntent.last_payment_error,
    metadata: paymentIntent.metadata,
  });

  if (paymentIntent.metadata?.reservationId && process.env.N8N_WEBHOOK_URL) {
    try {
      const axios = require('axios');
      await axios.post(process.env.N8N_WEBHOOK_URL, {
        event: 'payment_failed',
        reservationId: paymentIntent.metadata.reservationId,
        paymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error notificando a n8n:', error);
    }
  }
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

  // Notify n8n for additional processing (email, calendar, etc.)
  if (process.env.N8N_WEBHOOK_URL) {
    try {
      const axios = require('axios');
      await axios.post(process.env.N8N_WEBHOOK_URL, {
        event: 'checkout_complete',
        reservationId: metadata.reservationId,
        sessionId: session.id,
        customerEmail: session.customer_email || metadata.email,
        customerPhone: metadata.phone,
        customerName: metadata.name,
        date: metadata.date,
        timeSlot: metadata.timeSlot,
        guests: parseInt(metadata.guests || '0'),
        eventType: metadata.eventType,
        extras: metadata.extras ? metadata.extras.split(',') : [],
        basePrice: parseFloat(metadata.basePrice || '0'),
        totalPrice: parseFloat(metadata.totalPrice || '0'),
        depositAmount: parseFloat(metadata.depositAmount || '0'),
        message: metadata.message,
        contractUrl,
        paymentStatus: session.payment_status,
        timestamp: new Date().toISOString(),
      });
      console.log('n8n notified of checkout completion');
    } catch (error) {
      console.error('Error notificando a n8n:', error);
    }
  }
}
