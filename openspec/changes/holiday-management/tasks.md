## 1. Database

- [x] 1.1 Create migration `021_create_holidays.sql`: `holidays` table (id, holiday_date UNIQUE, name, source, blocked, created_by, created_at, updated_at) + index + `updated_at` trigger
- [x] 1.2 In the same migration, add nullable `holiday_id INTEGER REFERENCES holidays(id) ON DELETE CASCADE` to `blocked_slots`
- [x] 1.3 Seed the 14 researched 2026 Esplugues de Llobregat holidays with `source = 'seed'`
- [ ] 1.4 Apply the migration against the Neon database (MANUAL — not run automatically by this change)

## 2. Public API

- [x] 2.1 `GET /api/holidays` — returns `{ success, holidays: string[] }` (all dates, no auth)

## 3. Admin API

- [x] 3.1 `GET/POST /api/admin/holidays` — list all holidays; create a custom holiday (date + name)
- [x] 3.2 `PATCH/DELETE /api/admin/holidays/[id]` — edit date/name; toggle `blocked` (syncing `blocked_slots` rows via `holiday_id`); delete (cascades blocked_slots cleanup)

## 4. Admin UI

- [x] 4.1 `src/pages/admin/holidays.tsx` — table (date, name, source badge, blocked toggle, actions), create/edit modal, delete confirmation — follow `/admin/pricing` pattern
- [x] 4.2 Add "Festivos" entry to `src/components/admin/DashboardNav.tsx`

## 5. Pricing integration

- [x] 5.1 `src/utils/pricing.ts` — replace hardcoded `holidays2025` array with a module-level holiday set, `setHolidayDates()`, `loadHolidaysFromApi()` (5-min cache, fallback to bundled 2026 default list on fetch failure)
- [x] 5.2 Call `loadHolidaysFromApi()` in the existing mount-time fetch effect of `Step1Calendar.tsx`, `Step2Configuration.tsx`, `ReservationForm.tsx`, and `disponibilidad.tsx`

## 6. Verify

- [ ] 6.1 Confirm `/admin/holidays` lists the 14 seeded 2026 rows and supports add/edit/delete (MANUAL — needs a DB with the migration applied)
- [ ] 6.2 Confirm blocking a holiday makes all 3 slots unavailable in the public booking calendar, and unblocking restores holiday pricing (MANUAL)
- [ ] 6.3 Confirm a date newly added as a holiday shows `holiday_morning`/`holiday_afternoon` pricing in the booking flow after reload (MANUAL)
- [x] 6.4 Run `npm run build` / `tsc` to confirm no type errors introduced — both pass cleanly

## 7. Holiday booking confirmation (no auto-charge)

- [x] 7.1 `Step3CustomerData.tsx` — compute `isHoliday(state.date)`; skip the `/api/create-checkout-session` redirect for card payments on a holiday date and fall through to `nextStep()` like the bizum/cash path
- [x] 7.2 `Step4Confirmation.tsx` — add a holiday notice banner explaining the date requires HappyHub's explicit case-by-case confirmation before any payment link is sent
- [x] 7.3 `src/lib/whatsapp.ts` — add an `isHoliday` flag to `notifyAdminReservationRequest` that prefixes the admin WhatsApp message with a "FESTIVO — requiere confirmación caso a caso" marker
- [x] 7.4 `src/pages/api/webhook-reserva.ts` — query `holidays` for the submitted date and pass the result through to `notifyAdminReservationRequest`
- [ ] 7.5 Confirm booking a holiday date with card payment does NOT redirect to Stripe and lands on the holiday-notice confirmation screen (MANUAL — needs a DB with the migration applied)
- [ ] 7.6 Confirm booking a non-holiday date with card payment is unaffected (still redirects to Stripe instantly) (MANUAL)
