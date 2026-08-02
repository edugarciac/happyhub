## 1. Hide night pricing column

- [x] 1.1 Remove the "Noche" column header (with 22:00 - 02:00 schedule) from the table in `src/components/PricingTable.tsx`
- [x] 1.2 Remove the `night` field from the `PriceRow` interface and from each row definition
- [x] 1.3 Remove the corresponding `<td>` that rendered the night price in each table row

## 2. Verify

- [ ] 2.1 Run `npm run dev` and visually confirm the pricing table on the homepage only shows Mañana / Tarde
- [ ] 2.2 Confirm night pricing data is untouched in DB / `pricing.ts` / `pricingDb.ts` / admin pricing page
