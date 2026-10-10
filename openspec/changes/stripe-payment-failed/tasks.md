# Tasks
- [x] Add `last_payment_error`, `last_payment_error_at` columns (migration 024 + lazy migration)
- [x] Copy Checkout metadata to the PaymentIntent
- [x] `stripeDeclineMessage` + tests
- [x] Handle `payment_intent.payment_failed` in the webhook; clear on success
- [x] Remove n8n forwarding from the Stripe webhook
- [x] Show the denied payment in the admin reservations list
- [ ] Owner: subscribe the Stripe endpoint to `payment_intent.payment_failed`
