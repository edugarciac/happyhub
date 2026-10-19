## 1. Policy and data

- [x] 1.1 `src/utils/cancellationPolicy.ts` with `daysUntilEvent` and `isFullRefundEligible` + unit tests
- [x] 1.2 Columns `refunded_amount`, `refunded_at` in `ensureReservationFlowColumns`

## 2. Refunds

- [x] 2.1 `src/lib/reservationRefunds.ts`: `getRefundPlan` and `executeRefundPlan`
- [x] 2.2 `GET/POST /api/admin/reservations/[id]/refund`
- [x] 2.3 `status.ts`: accept `refund` on cancellation, run refunds, warnings and admin email
- [x] 2.4 Emails: refund info in `reservationCancelledEmail`, `refundIssuedEmail` for later refunds, `manualRefundAlertEmail` for admins

## 3. Admin UI

- [x] 3.1 Refund summary + checkbox in the cancel dialog
- [x] 3.2 "Devolver pagos" in the "Más" menu of cancelled reservations; "Devuelto: X €" in the list

## 4. Verify

- [x] 4.1 `npx tsc --noEmit`, `npm test`
- [ ] 4.2 Cancel a 1 € test reservation with the checkbox and check the refund in Stripe and the emails
