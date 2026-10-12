## 1. Pricing logic

- [x] 1.1 `isHoliday` compares the local date instead of `toISOString()`
- [x] 1.2 Add `getPricingRuleKey(date, slot)` and `resolvePriceFromRules(rules, date, slot)` to `src/utils/pricing.ts` (holiday/eve > weekend > Friday afternoon > weekday; 0/missing → 'consult')
- [x] 1.3 Update hardcoded `calculateBasePrice` and `getDayTypeDescription` to the new grid
- [x] 1.4 Update `getHardcodedPricing` and `calculateBasePriceFromDb` in `src/utils/pricingDb.ts`

## 2. Database

- [x] 2.1 Add `database/migrations/025_update_pricing_grid_2026.sql` with the new prices
- [ ] 2.2 Run the migration on Neon (or edit prices in `/admin/pricing`)

## 3. UI

- [x] 3.1 Replace duplicated rule logic in `Step1Calendar`, `Step2Configuration`, `ReservationForm`, `disponibilidad` with `resolvePriceFromRules`
- [x] 3.2 Generic "A consultar" blocking message in `Step1Calendar`
- [x] 3.3 `PricingTable`: "Festivos y vísperas" row; `disponibilidad` price summary updated
- [x] 3.4 `/disponibilidad`: "Solicitar reserva" passes the local date (`toDateStr`) instead of `toISOString()` (sent the previous day)

## 4. Verify

- [x] 4.1 Update `src/__tests__/pricing.test.ts` and run `npm test`
- [x] 4.2 Update `docs/project_notes/key_facts.md`
- [ ] 4.3 After deploy: check home table, a holiday eve in the calendar, and a normal Friday afternoon (180 €)
