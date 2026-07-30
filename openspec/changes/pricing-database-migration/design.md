## Context

The `pricing_rules` table and read-only `GET /api/pricing/current` endpoint already exist (migration `005_create_pricing_table.sql`, `src/utils/pricingDb.ts`). The booking flow (`Step1Calendar.tsx`, `Step2Configuration.tsx`, `ReservationForm.tsx`) already consumes this endpoint with hardcoded fallbacks matching the seeded rows. What is missing is an admin-facing CRUD so prices can be changed without SQL access or a deploy — specifically requested to support a one-time 25% price review/adjustment, applied manually by the admin through the UI.

The legacy `src/utils/pricing.ts` `calculateBasePrice()` function holds stale hardcoded values and is not used by the live booking flow. It is left untouched in this change to keep scope limited to the admin CRUD.

## Goals / Non-Goals

**Goals:**
- Admin can view all pricing rules (active and inactive) in one place
- Admin can edit the `price` (and other fields) of an existing rule without touching code
- Admin can create new rules (e.g. a new day_type/time_slot combination, or a future-dated rule with `effective_from`)
- Admin can deactivate/delete a rule
- Changes take effect on the public site within the existing 5-minute cache window (`pricingDb.ts` `CACHE_DURATION`)

**Non-Goals:**
- Bulk/percentage-based price update tools (e.g. "increase all by 25%" button) — out of scope; admin edits rows individually
- Changing how `calculateBasePriceFromDb` resolves a rule for a given date/slot
- Touching the unrelated `service_catalog` admin CRUD (already exists at `/admin/services`)
- Fixing the unused legacy `pricing.ts` hardcoded values

## Decisions

### Decision 1: Reuse the existing admin CRUD pattern

**Choice:** Follow the same structure as `/admin/services` + `/api/admin/services.ts` (from `admin-dashboard-crud`): `AdminLayout` wrapper, table + modal form, `react-hot-toast`, `requireAdminSession` guard, single `pricing.ts` file for GET/POST and `pricing/[id].ts` for PATCH/DELETE.

**Rationale:** Consistency with the rest of the admin area; no new patterns to learn or maintain.

### Decision 2: Table layout, not a generic DataTable

**Choice:** Plain HTML table listing all rows (rule_name, day_type, time_slot, price, effective_from/to, active), since `pricing_rules` has few rows (under ~15) and no pagination/search is needed.

**Rationale:** Matches the low row count; avoids over-engineering with the generic DataTable component that was deferred/never built for other entities either.

### Decision 3: Edit-in-modal, inline active toggle

**Choice:** Price/dates/description edited via a modal form (same UX as services). The `active` boolean gets a quick inline toggle button in the table row, since it's the most common single action (retire an old rule without deleting it).

**Rationale:** Keeps the common "deactivate a rule" action one click, while less frequent edits go through a guarded form with validation.

### Decision 4: Validation

**Choice:** `price >= 0` enforced both client-side and via the existing DB CHECK constraint. `rule_name` required and must stay unique (DB unique constraint already enforces `(day_type, time_slot, effective_from)`; surface a friendly error message on conflict instead of a raw 500).

## Risks / Trade-offs

**[Risk] Admin sets a price to 0 or an absurd value by mistake** → Mitigation: client-side sanity check (price between 0 and 1000) plus the table is small enough to review at a glance before saving.

**[Risk] Two effective rules overlap for the same day_type/time_slot** → Existing `pricingDb.ts` query already filters by `effective_from`/`effective_to` and `active`; no new resolution logic introduced here — admin is responsible for not creating overlapping active ranges, same as today via SQL.

**[Trade-off] No audit log of who changed a price and when** → Consistent with the rest of the admin area (no audit logging anywhere yet); deferred.

## Migration Plan

1. Add `GET/POST /api/admin/pricing` and `PATCH/DELETE /api/admin/pricing/[id]`.
2. Add `/admin/pricing` page.
3. Add a link to it from `AdminLayout.tsx` navigation and the dashboard cards.
4. No DB migration needed — `pricing_rules` table already exists.

**Rollback:** Remove the new page, nav link, and API routes; the existing read-only `/api/pricing/current` and booking flow are unaffected since nothing about the public schema or read path changes.
