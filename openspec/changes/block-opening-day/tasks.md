## 1. Implement

- [x] 1.1 `BOOKINGS_FROM_DATE` / `isBeforeBookingStart` in `config/opening.ts`
- [x] 1.2 `FullCalendar` and `webhook-reserva` use the booking start date
- [x] 1.3 `webhook-reserva` insert also checks `blocked_slots`
- [x] 1.4 Popup copy updated

## 2. Verify

- [x] 2.1 `tsc`, Jest 149/149; 15/16 blocked, 17 bookable
- [x] 2.2 SQL verified with pg-mem: blocked slot → no insert
- [ ] 2.3 Owner: reject the test reservations on 16 Oct from the admin panel
