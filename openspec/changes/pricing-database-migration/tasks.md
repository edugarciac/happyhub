## 1. API - Pricing CRUD

- [ ] 1.1 Create `src/pages/api/admin/pricing.ts` with GET (list all rules) and POST (create rule), guarded by `requireAdminSession`
- [ ] 1.2 Create `src/pages/api/admin/pricing/[id].ts` with PATCH (update) and DELETE, guarded by `requireAdminSession`
- [ ] 1.3 Validate `price >= 0` and required fields (`rule_name`, `day_type`, `time_slot`) server-side
- [ ] 1.4 Map unique constraint violations to a friendly 400 error message

## 2. Admin Page

- [ ] 2.1 Create `src/pages/admin/pricing.tsx` using `AdminLayout`
- [ ] 2.2 Fetch and display all rules in a table (rule_name, day_type, time_slot, price, effective_from/to, active)
- [ ] 2.3 Add "Nueva Regla" button opening a modal form (create)
- [ ] 2.4 Add edit button per row opening the same modal pre-filled (update)
- [ ] 2.5 Add inline active/inactive toggle per row
- [ ] 2.6 Add delete button with confirmation
- [ ] 2.7 Show toast notifications for success/error (react-hot-toast)

## 3. Navigation

- [ ] 3.1 Add a "Precios" link/card to `AdminLayout.tsx` sidebar and `src/pages/admin/dashboard.tsx` management cards

## 4. Verification

- [ ] 4.1 Confirm editing a price in the new UI is reflected by `GET /api/pricing/current` after cache expiry
- [ ] 4.2 Confirm non-admin requests to the new API routes are rejected with 401
