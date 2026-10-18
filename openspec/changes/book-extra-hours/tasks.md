## 1. Pricing
- [x] 1.1 `MAX_EXTRA_HOURS`, `extraHoursPrice`, `slotEndTime` in `src/utils/pricing.ts`

## 2. Booking wizard
- [x] 2.1 `extraHours` state + price in `BookingContext`
- [x] 2.2 Selector in `Step2Configuration`
- [x] 2.3 `PriceSummary` and `Step4Confirmation` show hours, end time and total
- [x] 2.4 `Step3CustomerData` sends `extraHours`

## 3. Backend
- [x] 3.1 `extra_hours` column in `ensureReservationFlowColumns`
- [x] 3.2 `webhook-reserva`: validate, store, contract snapshot, calendar end, emails
- [x] 3.3 Emails show extended schedule and extra hours row
- [x] 3.4 Admin list shows extra hours

- [x] 3.5 Recompute price server-side (`src/lib/reservationPricing.ts`) and reject mismatches

## 4. Verify
- [x] 4.1 Unit tests for pricing helpers and email rows
- [x] 4.2 Typecheck and tests pass
