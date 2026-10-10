## 1. Implement

- [x] 1.1 `BOOKABLE_TIME_SLOTS` / `isBookableTimeSlot` in `utils/pricing.ts`
- [x] 1.2 Remove night from `FullCalendar` (slots + legend)
- [x] 1.3 Remove night text from `/disponibilidad`, `/como-funciona`, `PricingTable`
- [x] 1.4 Customer validator + `webhook-reserva` reject night
- [x] 1.5 `/reservas` ignores `timeSlot=night`
- [x] 1.6 Admin: remove night option from create, edit, block dates, calendar, pricing
- [x] 1.7 Update pricing tests

## 2. Verify

- [x] 2.1 `tsc --noEmit` clean
- [x] 2.2 Jest: 140/140 passing
- [ ] 2.3 Visual check of `/disponibilidad` on phone
- [ ] 2.4 Check DB for existing night reservations/blocked slots after 16 Oct
