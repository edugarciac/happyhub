## 1. Data
- [x] 1.1 Migration 028 + runtime columns
- [x] 1.2 Config constants (150 €, windows)

## 2. Payments
- [x] 2.1 Checkout helper: manual capture option
- [x] 2.2 `/api/payments/remaining`: step remaining | security_deposit
- [x] 2.3 Webhook: hold registered, remaining no longer burns the link, payment_intent.canceled
- [x] 2.4 Admin APIs: security-deposit actions, mark-remaining-paid (terminal)
- [x] 2.5 `/api/payments/token` → 410

## 3. UI
- [x] 3.1 `/pagar/[token]` two-step page
- [x] 3.2 Admin "Cobro del día" modal with QR
- [x] 3.3 Customer names from acceptance evidence

## 4. Copy
- [x] 4.1 Terms, contract, PDF, FAQ, pricing table, emails, booking confirmation

## 5. Verify
- [ ] 5.1 tsc + Vercel READY
- [ ] 5.2 Subscribe Stripe webhook to payment_intent.canceled
- [ ] 5.3 Test with a real card on a test reservation
