## 1. Implementation

- [x] 1.1 Add `unmatchedPaymentAlertEmail` template in `src/lib/emailTemplates.ts`
- [x] 1.2 Accept `reservation_id` as fallback metadata key in `handleCheckoutComplete`
- [x] 1.3 Alert and stop on missing id, unknown code and non-existent reservation
- [x] 1.4 Alert on DB errors (deposit/remaining, security deposit, extra charge) and on non-existent extra charge

## 2. Verify

- [x] 2.1 Unit test for the alert template; `npx tsc --noEmit`; `npm test`
- [ ] 2.2 Resend a past `checkout.session.completed` event from Stripe and confirm no alert for a matched payment
