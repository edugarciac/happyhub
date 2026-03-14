## 1. Shared utilities

- [ ] 1.1 Extract `formatPhoneNumber` from `src/lib/whatsapp.ts` into a shared utility (`src/utils/phone.ts`) for client-side reuse in wa.me links
- [ ] 1.2 Create status transition map and validation helper (`src/utils/reservationStatus.ts`) with allowed transitions, Spanish labels, and badge color mappings

## 2. API endpoints (backend)

- [ ] 2.1 Rewrite `GET /api/admin/reservations` to query PostgreSQL (reservations JOIN users) with filters (status, dateFrom, dateTo, search) and pagination (limit, offset, total count)
- [ ] 2.2 Create `PATCH /api/admin/reservations/[id]` for editing reservation fields (event_date, time_slot, event_type, guests, total_price, deposit_amount, notes) with validation
- [ ] 2.3 Create `PATCH /api/admin/reservations/[id]/status` for status transitions with allowed-path validation
- [ ] 2.4 Create `DELETE /api/admin/reservations/[id]` for hard-deleting a reservation
- [ ] 2.5 Add JWT admin auth check to all new/rewritten endpoints (reuse pattern from existing `[id]/index.ts`)

## 3. Frontend - reservation list rewrite

- [ ] 3.1 Update `src/pages/admin/reservations/index.tsx` to fetch from the rewritten DB-backed GET endpoint
- [ ] 3.2 Add status filter dropdown with all five statuses (pending, approved, rejected, cancelled, completed) plus "all"
- [ ] 3.3 Render color-coded status badges (yellow/green/red/gray/blue) with Spanish labels
- [ ] 3.4 Add WhatsApp icon button per row linking to `https://wa.me/{formattedPhone}` (opens new tab)
- [ ] 3.5 Add email icon button per row with `mailto:{email}` link (opens new tab)
- [ ] 3.6 Disable WhatsApp/email buttons when phone/email is missing

## 4. Frontend - status management

- [ ] 4.1 Add status action buttons per row (Aprobar, Rechazar, Cancelar, Completar) showing only valid transitions for the current status
- [ ] 4.2 Wire status buttons to call `PATCH /api/admin/reservations/[id]/status` and refresh the row on success
- [ ] 4.3 Show error toast/message when an invalid transition is attempted

## 5. Frontend - edit and delete

- [ ] 5.1 Create edit modal (reuse existing `FormModal` component) with fields: event date, time slot, event type, guests, total price, deposit amount, security deposit (fianza), notes
- [ ] 5.2 Add client-side validation (no past dates, positive numbers, required fields)
- [ ] 5.3 Wire edit form submit to `PATCH /api/admin/reservations/[id]` and refresh list on success
- [ ] 5.4 Add delete button per row that opens `ConfirmDialog` showing reservation ID and customer name
- [ ] 5.5 Wire delete confirmation to `DELETE /api/admin/reservations/[id]` and refresh list on success

## 6. Contract print

- [ ] 6.1 Add `security_deposit` column (DECIMAL(10,2), nullable, default 200) to `reservations` table in `database/schema.sql` and `src/lib/db.ts`
- [ ] 6.2 Create contract print page `src/pages/admin/reservations/[id]/contract.tsx` that fetches reservation data from `GET /api/admin/reservations/[id]` and renders the contract as print-optimized HTML
- [ ] 6.3 Implement contract HTML layout: A4-optimized CSS with `@media print`, no nav/header/footer, adequate margins, signature area at bottom, all placeholders from `docs/contrato_alquiler_espacio.md` replaced with reservation data
- [ ] 6.4 Add formatting helpers: date as DD/MM/YYYY, time slot to actual hours (morning -> 11:00 - 14:30), event type to Spanish label, extras as comma-separated names, "-" for missing optional fields
- [ ] 6.5 Auto-trigger `window.print()` on page load via `useEffect`
- [ ] 6.6 Add "Imprimir contrato" button (printer icon) to the actions column of each reservation row in the admin list, linking to `/admin/reservations/[id]/contract` (opens new tab)
- [ ] 6.7 Add `security_deposit` field to the edit modal (task 5.1) with default value 200 EUR

## 7. Testing and polish

- [ ] 7.1 Verify all endpoints reject unauthenticated and non-admin requests (401/403)
- [ ] 7.2 Test status transition validation (valid and invalid paths)
- [ ] 7.3 Test edit validation (invalid data returns errors, valid data persists)
- [ ] 7.4 Test WhatsApp link formatting for various phone formats (with/without country code, spaces, dashes)
- [ ] 7.5 Test pagination, search, and filter combinations
- [ ] 7.6 Test contract print page renders correctly with all field types (full data, missing extras, missing message)
- [ ] 7.7 Verify contract print layout on A4 paper (margins, page breaks, signature area)
