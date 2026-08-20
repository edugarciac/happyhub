## Why

Holiday pricing today is driven by `isHoliday()` in `src/utils/pricing.ts`, a hardcoded array named `holidays2025` containing only 2025 dates. Since today's date is 2026-08-20, this means **no date currently returns `true` from `isHoliday()`** — holiday pricing has silently stopped applying for all of 2026. There is also no way for an admin to review, correct, or extend the holiday list without a code change and deploy.

We need a proper holiday maintenance feature: a database-backed, admin-editable list of holidays seeded from the official Esplugues de Llobregat municipal calendar, used to drive the existing holiday pricing tier (`pricing_rules` with `day_type = 'holiday'`). Additionally, the admin needs a per-holiday option to fully block a date (make it unavailable for booking) instead of just applying holiday pricing to it. Finally, even for holidays that are *not* blocked, HappyHub wants to review every holiday booking individually before it's paid — holidays should not be instantly self-bookable and charged like an ordinary day.

## What Changes

- Create a `holidays` table seeded with the 2026 Esplugues de Llobregat official calendar (12 Catalonia-wide holidays + 2 municipal local holidays)
- Add `GET /api/holidays` (public) so the booking flow can resolve holiday dates dynamically instead of using the hardcoded array
- Add admin CRUD (`/api/admin/holidays`, `/api/admin/holidays/[id]`) to list, create, edit, and delete holidays
- Add `/admin/holidays` admin page to manage the list (add/edit/delete, see seed vs. custom origin) and a per-row "Bloquear" toggle
- When a holiday is toggled "blocked", all 3 time slots for that date are inserted into the existing `blocked_slots` table (reusing the blocked-dates/availability mechanism already in place) instead of holiday pricing being applied; toggling it back off removes those blocked slots
- Replace the hardcoded `holidays2025` array in `src/utils/pricing.ts` with a dynamic, API-backed holiday set (`isHoliday()` keeps its existing synchronous signature; callers fetch and populate the set once on mount, same pattern already used for `pricing_rules`)
- Update `Step1Calendar.tsx`, `Step2Configuration.tsx`, `ReservationForm.tsx`, and `disponibilidad.tsx` to load holiday dates from the new API alongside the existing pricing fetch
- Add a "Festivos" link to the admin sidebar navigation
- Skip the automatic Stripe checkout redirect for card payments when the selected date is a holiday: the booking is submitted as a pending request (same as the existing bizum/cash path) instead of being paid instantly, and the confirmation screen explains that HappyHub confirms holiday bookings case by case before sending the payment link
- Flag holiday requests in the admin's new-reservation-request WhatsApp notification so they're easy to spot for manual review

## Capabilities

### New Capabilities

- `holiday-calendar-management`: Admin CRUD for the holidays table (seeded from the official Esplugues de Llobregat calendar, editable — add/edit/delete), plus a per-holiday "blocked" toggle that makes the date fully unavailable for booking via the existing `blocked_slots` mechanism
- `holiday-pricing-integration`: Holiday pricing determination (`isHoliday()` and its dependents) is driven by the database instead of a hardcoded, stale (2025-only) date array
- `holiday-booking-confirmation`: Holiday bookings (blocked or not) never get auto-charged; card payments on a holiday date fall back to the existing pending-request + manual-approval flow instead of instant Stripe checkout

### Modified Capabilities

- `booked-slots-api`: No code change required — blocked-slot rows created by holiday blocking use the same `blocked_slots` table already surfaced by `/api/booked-slots` and `/api/admin/booked-slots`

## Impact

- **Database**: New `holidays` table + seed data (migration `021_create_holidays.sql`); adds nullable `holiday_id` FK column to `blocked_slots`
- **API routes**: New `src/pages/api/holidays.ts` (public), `src/pages/api/admin/holidays.ts`, `src/pages/api/admin/holidays/[id].ts`
- **Admin UI**: New `src/pages/admin/holidays.tsx`; nav link added in `src/components/admin/DashboardNav.tsx`
- **Pricing**: `src/utils/pricing.ts` (`isHoliday`, new `setHolidayDates`/`loadHolidaysFromApi`); `src/components/booking/Step1Calendar.tsx`, `src/components/booking/Step2Configuration.tsx`, `src/components/ReservationForm.tsx`, `src/pages/disponibilidad.tsx` each add one fetch call
- **Booking flow**: `src/components/booking/Step3CustomerData.tsx` (skip Stripe redirect for holiday + card), `src/components/booking/Step4Confirmation.tsx` (holiday notice banner)
- **Admin notification**: `src/lib/whatsapp.ts` (`notifyAdminReservationRequest` holiday marker), `src/pages/api/webhook-reserva.ts` (looks up whether the date is a holiday)
- No changes to Google Calendar sync — holiday-driven blocks do not create GCal events (out of scope, see design.md)
- No new admin action introduced for sending holiday payment links — reuses the existing `/admin/approve-reservation/[id]` flow already used for bizum/cash reservations
