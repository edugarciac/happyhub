## 1. Update central pricing definition

- [x] 1.1 Update `TIME_SLOTS` morning entry in `src/utils/pricing.ts` to `startTime: '10:00'`, `endTime: '14:00'`, remove `earlyOpenTime`

## 2. Update display labels across the app

- [x] 2.1 `src/components/PricingTable.tsx`
- [x] 2.2 `src/components/FullCalendar.tsx`
- [x] 2.3 `src/components/ReservationForm.tsx`
- [x] 2.4 `src/components/booking/Step4Confirmation.tsx`
- [x] 2.5 `src/pages/disponibilidad.tsx`
- [x] 2.6 `src/pages/como-funciona.tsx`
- [x] 2.7 `src/pages/pagar/[token].tsx`
- [x] 2.8 `src/pages/booking/success.tsx`
- [x] 2.9 `src/pages/admin/approve-reservation/[id].tsx`
- [x] 2.10 `src/pages/admin/reservations/create.tsx`
- [x] 2.11 `src/pages/admin/reservations/index.tsx`
- [x] 2.12 `src/pages/admin/reservations/blocked-dates.tsx`
- [x] 2.13 `src/pages/admin/reservations/[id]/contract.tsx`
- [x] 2.14 `src/lib/whatsapp.ts`
- [x] 2.15 `src/lib/pdf.ts`
- [x] 2.16 `src/pages/api/create-checkout-session.ts`

## 3. Update business logic using the start time

- [x] 3.1 `src/components/booking/Step3CustomerData.tsx` — timeMap morning `11:00` → `10:00`
- [x] 3.2 `src/pages/api/admin/block-dates.ts` — morning `end` `14:30` → `14:00`
- [x] 3.3 `src/pages/api/google-calendar-slots.ts` — update comment (logic already correct)

## 4. Verify

- [ ] 4.1 Run `npm run dev` and confirm the homepage pricing table shows "10:00 - 14:00" for Mañana
- [ ] 4.2 Confirm `/disponibilidad`, `/como-funciona`, booking wizard, and admin reservation pages show the updated hours
- [ ] 4.3 Confirm afternoon/night slots and their prices are unchanged
