## 1. Implement

- [x] 1.1 `utils/reservationCode.ts` (build + parse) with tests
- [x] 1.2 `cancel-pending` lookup by parsed id
- [x] 1.3 `stripe-webhook` updates by parsed id; CRITICAL log on unknown code
- [x] 1.4 `tsc`, Jest 155/155

## 2. Verify / owner

- [ ] 2.1 Test in prod: start card payment, cancel → slot free again
- [ ] 2.2 Check Stripe for deposits paid before this fix and mark them in the admin panel
