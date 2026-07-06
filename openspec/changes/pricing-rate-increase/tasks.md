## 1. Migration

- [x] 1.1 Create `database/migrations/015_increase_pricing_20_percent.sql` with `UPDATE pricing_rules SET price = ROUND(price * 1.20, 2)` and a commented DOWN rollback
- [x] 1.2 Create `scripts/run-pricing-increase-migration.js` that prints prices before the update, applies it, and prints prices after

## 2. Verification

- [ ] 2.1 Run the script against the real Neon database (requires `DATABASE_URL` in `.env.local`, not available in this sandbox)
- [ ] 2.2 Confirm `GET /api/pricing/current` reflects the new prices after the 5-minute cache expires
- [ ] 2.3 Spot-check the booking flow (`/disponibilidad`) shows the increased prices
