## 1. Fix

- [x] 1.1 Require paid `payment_status` in the idempotency check of `src/pages/api/stripe-webhook.ts`

## 2. Verify

- [x] 2.1 `npx tsc --noEmit`, `npm test`
- [ ] 2.2 Resend the lost `checkout.session.completed` events from Stripe and confirm the reservations become "Señal pagada"
