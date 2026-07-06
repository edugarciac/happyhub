## Why

Business needs a 20% price increase across all venue rental time slots to reflect updated costs. Pricing already lives in the `pricing_rules` table (see `pricing-database-migration`), so this is a data update, not a code change — but per project workflow it still needs a documented, reviewable migration script rather than an ad-hoc manual `UPDATE`.

## What Changes

- Add a one-off database migration that raises `price` by 20% for every row in `pricing_rules` (all day types × time slots)
- Add a runner script (mirroring `scripts/run-pricing-migration.js`) that applies the migration and prints before/after prices for verification
- No application code changes: `pricingDb.ts` already reads prices dynamically from the table, and its 5-minute in-memory cache will pick up the new values automatically

## Capabilities

### New Capabilities
<!-- None: this is a data migration, not a new capability -->

### Modified Capabilities
<!-- None: no requirement-level behavior changes; `pricing-database` capability already supports arbitrary prices -->

## Impact

**Database:**
- `pricing_rules` table: all rows' `price` column increased by 20% (rounded to 2 decimals)
- Rows with `price = 0` (`night_consult`, `night_consult_weekend`) remain 0

**Code Changes:**
- None. `src/utils/pricingDb.ts` reads current `pricing_rules` rows at request time (5 min cache), so the new prices appear without a deploy.

**New Files:**
- `database/migrations/015_increase_pricing_20_percent.sql`
- `scripts/run-pricing-increase-migration.js`

**Rollback:**
- The migration file includes a commented-out DOWN section that divides prices back by 1.20, for use if the increase needs to be reverted before the next legitimate price change.
