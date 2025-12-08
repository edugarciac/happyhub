import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY no está configurada en las variables de entorno');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
}

export async function createPaymentIntent({
  amount,
  currency = 'eur',
  description,
  metadata,
  customerEmail,
}: CreatePaymentIntentParams) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      description,
      metadata,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
}

export async function createCheckoutSession({
  lineItems,
  successUrl,
  cancelUrl,
  customerEmail,
  metadata,
}: {
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata,
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export function constructWebhookEvent(payload: string | Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET no está configurada');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    throw error;
  }
}
