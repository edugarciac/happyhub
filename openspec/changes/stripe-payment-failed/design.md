# Design

- `src/utils/stripeErrors.ts` → `stripeDeclineMessage(error)` maps `decline_code`/`code` to Spanish text; falls back to Stripe's message, then "Pago con tarjeta rechazado".
- `stripe-webhook.ts` `handlePaymentFailure`: reservation code from `paymentIntent.metadata.reservationId`, else `stripe.checkout.sessions.list({ payment_intent })`; parsed with `parseReservationCode`; `UPDATE reservations SET last_payment_error, last_payment_error_at = NOW()`. Status is not changed: the customer can retry until the deadline, and expiry still cancels as before.
- Only the latest error is kept (no history table): enough for the admin to act; Stripe keeps the full history.
- Admin API exposes `lastPaymentError`/`lastPaymentErrorAt`; UI hides it once the deposit or full payment is recorded.
- n8n forwarding removed from the webhook; WhatsApp/email notifications are handled in-app.
