# Tasks: kids-furniture-booking-question

## T1 — Database
- [x] Migration 020: `needs_kids_furniture` column on `reservations`

## T2 — n8n workflow
- [x] `NormalizarDatos`: read `body.needsKidsFurniture`
- [x] `GuardarEnNeonDB`: include column in INSERT
- [ ] Re-import `n8n-reserva-neon-whatsapp.json` into the live n8n instance (manual step, outside this repo)

## T3 — Booking flow
- [ ] `BookingContext.tsx`: add `needsKidsFurniture` to `BookingState`/`SET_CUSTOMER_DATA`
- [ ] `Step3CustomerData.tsx`: checkbox + copy, include in schema and POST payload
- [ ] `webhook-reserva.ts`: add field to `ReservationData` interface (passthrough)

## T4 — Admin visibility
- [ ] `src/pages/api/admin/reservations.ts`: include column in SELECT/response mapping and edit PATCH
- [ ] `src/pages/admin/reservations/index.tsx`: list badge + edit toggle
- [ ] `src/pages/admin/approve-reservation/[id].tsx`: highlighted detail badge

## T5 — WhatsApp notification
- [ ] `notifyAdminReservationRequest()`: append conditional line when flag is true

## Verification
- [ ] Book a test reservation with the flag checked → confirm `needs_kids_furniture = true` in DB (after n8n re-import)
- [ ] Confirm admin list shows the indicator and it's editable
- [ ] Confirm approval detail page shows the highlighted badge
- [ ] Confirm WhatsApp message includes the line only when true
- [ ] Confirm contract PDF is unaffected either way
