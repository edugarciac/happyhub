## Context

Holiday-aware pricing already exists as a concept: `pricing_rules` has `day_type = 'holiday'` rows (`holiday_morning`, `holiday_afternoon`) with real prices, and 4 client-side call sites (`Step1Calendar.tsx`, `Step2Configuration.tsx`, `ReservationForm.tsx`, `disponibilidad.tsx`) each reimplement the same `ruleKey` resolution, calling `isHoliday(date)` from `src/utils/pricing.ts` to decide whether to use the `holiday_*` price. `isHoliday()` currently checks membership in a hardcoded `holidays2025` array — stale for 2026 and un-editable without a deploy.

Separately, `blocked_slots` (from the `blocked-dates` change) already gives us a working, tested mechanism for making a date/time-slot combination unavailable to clients: it's read by `/api/booked-slots` (public) and `/api/admin/booked-slots` (admin), and managed via `/admin/reservations/blocked-dates`. We reuse it rather than inventing a second "unavailable" concept.

Researched via web search (network egress to primary sources like gencat.cat/esplugues.cat was blocked in this environment, so this is cross-referenced from multiple secondary sources, not fetched directly from the DOGC): the 2026 Catalonia-wide labor calendar has 12 holidays (Nov 1 and Dec 6 are dropped because they fall on a Sunday in 2026), and Esplugues de Llobregat's ajuntament approved 2 local holidays for 2026 — May 25 and September 21 — in June 2025. This gives 14 seed rows total for 2026.

## Goals / Non-Goals

**Goals:**
- Single source of truth for "is this date a holiday" that the admin can edit without a deploy
- Seed data admin can review/correct (since it wasn't fetched from a primary source, accuracy depends on admin review — this is explicitly why edit/add/remove is a hard requirement, not a nice-to-have)
- Per-holiday choice: apply holiday pricing (default) OR block the date entirely
- Minimal-diff integration with the 4 existing pricing call sites and the existing blocked-slots mechanism

**Non-Goals:**
- Rewriting the duplicated `ruleKey` resolution logic across the 4 call sites into a shared function (pre-existing duplication, out of scope)
- Google Calendar sync for holiday-driven blocks (the existing `blocked-dates` feature does this for manual blocks; holiday blocks skip it to avoid extra Google API surface/quota for a first version — `blocked_slots.google_calendar_event_id` stays NULL for these rows)
- Multi-year seeding — only 2026 is seeded (2027's Catalonia calendar and Esplugues' local holidays aren't approved yet at the time of this change); the admin adds future years manually as they become official
- Server-side re-validation of submitted booking prices (pre-existing trust model: prices are computed client-side and submitted with the reservation; unchanged by this feature)
- Touching the dead/unused `calculateBasePrice()` (pricing.ts) and `calculateBasePriceFromDb()` (pricingDb.ts) legacy functions — same precedent as `pricing-database-migration`

## Decisions

### 1. `holidays` table, one row per date

`holidays(id, holiday_date UNIQUE, name, source ['seed'|'custom'], blocked BOOLEAN DEFAULT false, created_by, created_at, updated_at)`. `source` lets the admin UI show a badge distinguishing the seeded municipal calendar from custom entries, without restricting editing — seeded rows can be freely edited or deleted like any other row.

### 2. Reuse `blocked_slots` for holiday blocking, via a nullable FK

Add `holiday_id INTEGER REFERENCES holidays(id) ON DELETE CASCADE` to `blocked_slots`. Toggling a holiday's `blocked` flag to `true` upserts 3 rows (morning/afternoon/night) into `blocked_slots` with `holiday_id` set and `reason = 'Festivo: <name>'`; toggling it off deletes `blocked_slots WHERE holiday_id = $1`. Deleting the holiday row cascades and removes any of its blocked_slots rows automatically — no orphaned blocks.

**Rationale**: `/api/booked-slots` and `/api/admin/booked-slots` already union `blocked_slots` into availability with zero code changes needed. The existing `/admin/reservations/blocked-dates` page will also show holiday-driven blocks (reason text makes the origin clear). This avoids a second "is this date bookable" code path.

**Alternative considered**: A `blocked` flag checked directly by `/api/booked-slots` via an extra query — rejected because it would duplicate the same union logic `blocked_slots` already provides, for no benefit.

### 3. Pricing integration keeps `isHoliday()` synchronous

Rather than making `isHoliday(date)` async (which would touch every call site's render logic), `pricing.ts` gets a module-level mutable holiday set plus two new exports:
- `setHolidayDates(dates: string[])` — synchronous setter
- `loadHolidaysFromApi()` — async, fetches `GET /api/holidays`, calls `setHolidayDates`, with a 5-minute in-memory cache (mirrors `pricingDb.ts`'s `CACHE_DURATION` pattern)

Each of the 4 call sites already fetches `/api/pricing/current` in a mount-time effect and gates calendar interaction behind an `isLoading`/`pricingLoading` flag before any price is computed. Adding `loadHolidaysFromApi()` to the same effect (in parallel with the pricing fetch) means `isHoliday()` is backed by real data by the time it's ever called — no new loading state needed.

The old hardcoded `holidays2025` array becomes the resilience fallback (renamed, kept in sync with the 2026 seed data) used only if the `/api/holidays` fetch fails.

**Rationale**: Minimal diff — the 4 call sites gain one fetch call each instead of a rewrite to async/await through their price-calculation paths.

### 4. No server-side price validation added

Reservation creation does not currently re-derive price server-side from date/slot (client computes and submits `totalPrice`). This change doesn't alter that trust boundary — flagged as a pre-existing gap, not introduced or worsened here.

## Risks / Trade-offs

- **[Risk] Seed data accuracy** — sourced via web search cross-referencing multiple secondary sites, not fetched directly from an official primary source (DOGC/gencat.cat/esplugues.cat were unreachable from this environment). Mitigation: `source = 'seed'` is visibly badged in the admin UI so the admin knows to double check it against the ajuntament's published calendar; the whole point of this feature is that it's editable.
- **[Risk] Holiday-driven block and a reservation collide** — same pre-existing gap as manual `blocked_slots` (`blocked-dates` change's own risk log): no guard against blocking a date that already has a confirmed reservation. Admin must check manually, same as today.
- **[Trade-off] No GCal event for holiday blocks** — if the admin wants the block visible on the shared Google Calendar, they'd need to also create a manual block via the existing `/admin/reservations/blocked-dates` flow. Acceptable for a first version; can be added later by reusing the same GCal helper functions used for manual blocks.
