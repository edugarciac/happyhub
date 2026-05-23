# Tasks: blocked-dates

## T1 — Database migration
- [ ] Create `database/migrations/010_create_blocked_slots.sql`
- [ ] Run migration against Neon DB (via apply-schema-direct.js or Neon console)

## T2 — API: Replace block-dates.ts
- [ ] Rewrite `src/pages/api/admin/block-dates.ts` (DB-backed, range expansion, GCal)
- [ ] Create `src/pages/api/admin/block-dates/[id].ts` (PATCH reason)

## T3 — API: Modify booked-slots.ts
- [ ] Add blocked_slots UNION to `src/pages/api/booked-slots.ts`

## T4 — API: Admin booked-slots endpoint
- [ ] Create `src/pages/api/admin/booked-slots.ts` (typed slots for admin calendar)

## T5 — UI: Blocked dates management page
- [ ] Create `src/pages/admin/reservations/blocked-dates.tsx`

## T6 — UI: Button in reservations index
- [ ] Add "Bloquear fechas" button to `src/pages/admin/reservations/index.tsx`

## T7 — UI: Admin calendar differentiation
- [ ] Update `src/pages/admin/calendar.tsx` to use /api/admin/booked-slots and style blocked slots

## Verification
- [ ] Create range block → rows in DB
- [ ] Public calendar shows slots as unavailable
- [ ] Admin calendar shows amber/locked blocked slots
- [ ] Google Calendar events created
- [ ] Delete slot → removed from DB and GCal
- [ ] Edit reason → updates correctly
