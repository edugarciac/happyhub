## 1. Implement

- [x] 1.1 Create `src/hooks/useBackdropClose.ts`
- [x] 1.2 Apply to partners modals (edit/create, delete)
- [x] 1.3 Apply to reservations modals (full payment, edit, delete, deposit link)
- [x] 1.4 Apply to reviews modals (view, delete confirm)

## 2. Verify

- [x] 2.1 `npx tsc --noEmit` and lint pass
- [ ] 2.2 Manual: select text in a partner input, release over the backdrop → modal stays open
- [ ] 2.3 Manual: click on backdrop → modal closes

## 3. Numeric inputs

- [x] 3.1 Reservation edit modal: guests, totalPrice, depositAmount accept `''`; validate on save
- [x] 3.2 `/admin/services`: sort_order accepts `''`; sends 0 when empty
- [x] 3.3 Booking step 2: guests draft string, revert on blur
- [ ] 3.4 Manual: clear the total price in a reservation edit → field stays empty
