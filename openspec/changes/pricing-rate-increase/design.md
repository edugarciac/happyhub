## Context

Prices for the venue are stored in `pricing_rules` (created in migration `005_create_pricing_table.sql`), one row per `(day_type, time_slot)` combination. The booking flow reads current prices via `src/utils/pricingDb.ts` → `GET /api/pricing/current`, cached in-memory for 5 minutes. Admins can already edit individual rules through `/admin/pricing`, but a blanket 20% increase across every row is tedious and error-prone to do by hand through that UI, so a scripted migration is more reliable and auditable.

## Goals / Non-Goals

**Goals:**
- Increase every `pricing_rules.price` by exactly 20%, rounded to 2 decimals (matching the column's `DECIMAL(10,2)` type)
- Keep `price = 0` rows ("a consultar" slots) at 0 — 20% of 0 is still 0, so no special-casing is needed
- Leave a clear, reusable rollback path in case the increase needs to be undone
- Reuse the existing migration-runner pattern (`scripts/run-pricing-migration.js`) so the script is consistent with how this repo already applies SQL changes

**Non-Goals:**
- No change to `day_type`/`time_slot` structure or to which rules exist
- No change to the `effective_from`/`effective_to` windowing behavior
- No application code changes — the price read path is already dynamic

## Decisions

### 1. Single `UPDATE ... SET price = ROUND(price * 1.20, 2)` over all rows

**Decision**: One unconditional `UPDATE pricing_rules SET price = ROUND(price * 1.20, 2)`, not per-row hardcoded values.

**Rationale**: Percentage increases should be computed from whatever the current price is, not re-derived from a snapshot of today's values — this keeps the script correct even if prices already changed since this was written. Rounding to 2 decimals matches the column precision and avoids accumulating fractional cents.

**Alternative rejected**: Hardcoding the new absolute price per rule (e.g. `UPDATE ... SET price = 132.00 WHERE rule_name = 'weekday_morning'`) — brittle if rules are added/renamed, and doesn't generalize to future percentage changes.

### 2. Not idempotency-guarded — this is a one-time operation

**Decision**: The migration does not check "has this already run" before applying. Running it twice would compound the increase (20% then another 20%).

**Rationale**: Unlike schema migrations (`CREATE TABLE IF NOT EXISTS`), a percentage-based data update has no natural idempotency check — there's no reliable way to distinguish "already increased" from "coincidentally already at that price." The runner script prints before/after prices so whoever runs it can visually confirm it should only be run once, same discipline as `scripts/run-pricing-migration.js`.

### 3. Runner script location and pattern

**Decision**: `scripts/run-pricing-increase-migration.js`, following the exact structure of `scripts/run-pricing-migration.js` (Neon `Pool` + `ws` websocket constructor, reads `.env.local` for `DATABASE_URL`, splits SQL at `-- DOWN MIGRATION`).

**Rationale**: Consistency with the existing script in this repo; no new tooling introduced.

## Rollout

- Run manually via `node scripts/run-pricing-increase-migration.js` in an environment with `DATABASE_URL` configured (this change does not wire it into CI/deploy)
- Verify new prices via the printed before/after table, and spot-check `GET /api/pricing/current` after the 5-minute cache expires
