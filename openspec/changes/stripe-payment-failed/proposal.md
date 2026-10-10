# Proposal: Denied Stripe payments visible in the admin panel

## Why
When a customer's card is declined (insufficient funds, failed 3DS, expired card...), the admin panel shows nothing. The team cannot tell "has not tried to pay" from "tried and the bank declined", so it cannot help the customer before the 24h payment window expires.

## What changes
- Handle the Stripe webhook event `payment_intent.payment_failed` and store the decline reason (in Spanish) on the reservation (`last_payment_error`, `last_payment_error_at`).
- Checkout sessions copy their metadata to the PaymentIntent (`payment_intent_data.metadata`) so the failed event carries the reservation code; older sessions are resolved by looking up the Checkout session of the PaymentIntent.
- Successful deposit/remaining payments clear the stored error.
- The admin reservations list shows "⚠️ Pago con tarjeta denegado: <motivo> · <fecha>" while the reservation is unpaid.
- Remove the leftover n8n forwarding from the Stripe webhook (it posted to the reservation-creation n8n URL and could create junk reservations).

## Impact
- DB: two nullable columns on `reservations` (migration 024 + lazy `ensureReservationFlowColumns`).
- Stripe dashboard: the webhook endpoint must also subscribe to `payment_intent.payment_failed`.
