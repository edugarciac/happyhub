## 1. Update central pricing definition

- [x] 1.1 Update `TIME_SLOTS` afternoon entry in `src/utils/pricing.ts` to `startTime: '16:00'`, `endTime: '20:00'`, remove `earlyOpenTime`

## 2. Update display labels across the app

- [x] 2.1 `src/components/PricingTable.tsx`
- [x] 2.2 `src/components/FullCalendar.tsx`
- [x] 2.3 `src/components/ReservationForm.tsx`
- [x] 2.4 `src/components/booking/Step4Confirmation.tsx`
- [x] 2.5 `src/pages/disponibilidad.tsx` (incl. removing early-access mention for afternoon)
- [x] 2.6 `src/pages/como-funciona.tsx` (early-access mention now only for night)
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

- [x] 3.1 `src/components/booking/Step3CustomerData.tsx` — timeMap afternoon `16:30` → `16:00`
- [x] 3.2 `src/pages/api/admin/block-dates.ts` — afternoon `start` `15:30` → `16:00`, `end` `20:30` → `20:00`
- [x] 3.3 `src/pages/api/google-calendar-slots.ts` — update comment (logic already correct)

## 4. Verify

- [ ] 4.1 Run `npm run dev` and confirm the homepage pricing table shows "16:00 - 20:00" for Tarde
- [ ] 4.2 Confirm `/disponibilidad`, `/como-funciona`, booking wizard, and admin reservation pages show the updated hours
- [ ] 4.3 Confirm morning/night slots and their prices are unchanged
