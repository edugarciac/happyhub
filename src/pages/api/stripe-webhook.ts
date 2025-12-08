import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe';

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

    const event = constructWebhookEvent(buf.toString(), signature);

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
        await handleCheckoutComplete(session);
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

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log('Procesando checkout completado:', {
    id: session.id,
    customer: session.customer,
    paymentStatus: session.payment_status,
    metadata: session.metadata,
  });

  if (session.metadata?.reservationId && process.env.N8N_WEBHOOK_URL) {
    try {
      const axios = require('axios');
      await axios.post(process.env.N8N_WEBHOOK_URL, {
        event: 'checkout_complete',
        reservationId: session.metadata.reservationId,
        sessionId: session.id,
        customerEmail: session.customer_email,
        paymentStatus: session.payment_status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error notificando a n8n:', error);
    }
  }
}
