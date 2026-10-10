## 1. Data
- [x] 1.1 Migration 023 + `ensureReservationFlowColumns()`

## 2. Request
- [x] 2.1 Step3: remove cash, remove Stripe redirect
- [x] 2.2 webhook-reserva: store payment_method; run expiry before insert
- [x] 2.3 Step4 + request email: state-specific copy

## 3. Approval & payment
- [x] 3.1 status.ts approve: due date, deposit token, approval email
- [x] 3.2 `/pagar/[token]` + `payments/remaining`: deposit support, Bizum instructions
- [x] 3.3 stripe-webhook: mark deposit token used
- [x] 3.4 Admin: mark Bizum deposit received (endpoint + button), show due date

## 4. Expiry
- [x] 4.1 `expireUnpaidReservations()` + email
- [x] 4.2 Call from booked-slots and webhook-reserva
- [x] 4.3 Vercel daily cron `/api/cron/expire-reservations`

## 5. Verify
- [x] 5.1 tsc, Jest, SQL checks

## 6. Verification notes
- [x] tsc clean, Jest 160/160, `next build` OK
- [x] SQL run against real PostgreSQL 16 (exact queries from source): migration idempotent; insert stores payment_method and blocks duplicates; approve sets due date +24 h; expiry cancels only approved+unpaid+overdue, once; freed slot rebookable; Bizum mark only on approved+unpaid, once; /pagar query reads deposit, method and due date
- [ ] Owner: set CRON_SECRET in Vercel (recommended)
- [ ] Owner: end-to-end test in prod (request → approve → email → pay card / mark Bizum; and let one expire)
