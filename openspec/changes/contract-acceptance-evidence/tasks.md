## 1. Database
- [x] 1.1 `database/migrations/026_contract_acceptances.sql` (table, indexes, immutability trigger)
- [x] 1.2 `src/lib/contractAcceptance.ts` with idempotent ensure + record + confirm-email helpers
- [x] 1.3 `database/migrations/027_early_access_extra.sql`

## 2. API
- [x] 2.1 `webhook-reserva.ts`: validate acceptance, store evidence, roll back on failure, mark email sent
- [x] 2.2 `admin/reservations/[id]/index.ts`: return evidence

## 3. Frontend and copy
- [x] 3.1 `Step3CustomerData.tsx`: send acceptTerms, version, terms text, scrolled flag
- [x] 3.2 Customer email: acceptance confirmation
- [x] 3.3 Contract: evidence block, identity fallback, 30-min access, no night slot
- [x] 3.4 FAQ, terms, PDF, pricing table: 30 min + 1 h for 30 €
- [x] 3.5 Privacy policy: evidence data and retention

## 4. Verify
- [ ] 4.1 Syntax check changed files; Vercel build READY
- [ ] 4.2 After deploy, make a test booking and confirm the row exists
