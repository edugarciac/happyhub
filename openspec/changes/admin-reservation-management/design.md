## Context

The admin reservations page (`/admin/reservations`) currently fetches data from Stripe checkout sessions via the Stripe API. This works for payment-centric views but prevents any write operations, status management, or access to reservations that did not go through Stripe. The PostgreSQL database (Neon) already stores a complete `reservations` table with all needed fields including `status`, joined to `users` for contact info. The individual reservation detail endpoint (`/api/admin/reservations/[id]`) already reads from the DB and requires JWT admin auth.

WhatsApp integration exists server-side (`src/lib/whatsapp.ts`) for automated messages. For admin-initiated contact, client-side deep links (`wa.me/` and `mailto:`) are simpler and more appropriate since the admin controls the conversation.

## Goals / Non-Goals

**Goals:**
- Single source of truth: all reservation reads/writes go through the PostgreSQL database
- Full CRUD for reservations behind admin JWT auth
- Status lifecycle with clear transition rules
- One-click customer contact (WhatsApp, email) from the reservation list
- Maintain existing Stripe payment data as reference (read-only)

**Non-Goals:**
- Migrating historical Stripe-only sessions into the database (separate task)
- Modifying the customer-facing booking flow
- Server-side WhatsApp messaging from admin actions (admin uses wa.me links directly)
- Notification automation on status changes (can be added later)
- Bulk operations (multi-select delete, bulk status change)

## Decisions

### 1. DB-backed API instead of Stripe API for the list

**Decision**: Rewrite `/api/admin/reservations` to query the `reservations` + `users` tables directly.

**Rationale**: The DB already has the canonical reservation data. Stripe is the source of truth for payments only. Reading from DB enables write operations, proper pagination with COUNT, and faster queries. Stripe session data (payment status, amounts) is stored in reservation metadata columns.

**Alternatives considered**: Hybrid approach (merge DB + Stripe data per request) - rejected due to complexity and latency of calling Stripe API on every admin page load.

### 2. Status transitions with validation

**Decision**: Implement a state machine with allowed transitions:
- `pending` -> `approved`, `rejected`, `cancelled`
- `approved` -> `cancelled`, `completed`
- `rejected` -> `pending` (re-open)
- `cancelled` -> `pending` (re-open)
- `completed` -> (terminal, no transitions)

**Rationale**: Prevents invalid states (e.g., completing a rejected reservation). Simple enough to implement as a lookup map without a library.

### 3. Client-side contact links (wa.me / mailto)

**Decision**: Use `<a href="https://wa.me/34XXXXXXXXX">` and `<a href="mailto:...">` links rendered in each row, opening in a new tab.

**Rationale**: No server round-trip needed. Admin clicks, phone/desktop opens WhatsApp or email client. The phone number formatting logic from `src/lib/whatsapp.ts` (strip non-digits, add `34` prefix for Spanish numbers) is reused client-side as a utility.

**Alternatives considered**: Server-side WhatsApp API send from admin panel - rejected because admin wants conversational control, not automated messages.

### 4. Inline status change + modal for full edit

**Decision**: Status change via a dropdown or button group directly in the table row. Full edit (date, time, guests, prices, notes) opens a modal form. Delete uses a confirmation dialog.

**Rationale**: Status changes are frequent and should be fast (one click). Full edits are less frequent and need form validation, so a modal is appropriate. This matches the existing admin UI patterns (`FormModal`, `ConfirmDialog` components already exist).

### 5. Soft delete vs hard delete

**Decision**: Hard delete with confirmation dialog. The admin explicitly confirms before deletion.

**Rationale**: Reservations are not high-volume enough to warrant soft-delete complexity. The confirmation dialog prevents accidents. If audit trail is needed later, database-level logging can be added.

### 6. Contract generation as client-side print page

**Decision**: Generate the contract as a dedicated Next.js page (`/admin/reservations/[id]/contract`) that fetches reservation data from the existing detail API and renders print-optimized HTML. The page calls `window.print()` on load. No PDF library needed.

**Rationale**: The contract is signed physically at the venue before the event, so a browser print (to paper or to PDF via the browser's "Save as PDF") is sufficient. This avoids adding server-side PDF dependencies (puppeteer, jsPDF) and keeps the solution simple. The contract template (`docs/contrato_alquiler_espacio.md`) defines the content structure; the page translates it to styled HTML with `@media print` CSS.

**Contract details**: Includes a security deposit (fianza, default 200 EUR) retained up to 15 days post-event, with a documented damage assessment procedure (written notification with photos, deduction from fianza, right to claim the difference). The fianza amount is stored in the reservation record (`security_deposit` column, nullable, defaults to 200) and editable via the admin edit modal.

**Alternatives considered**: Server-side PDF generation via API endpoint - rejected because it adds complexity (headless browser or PDF library) for a feature that's used infrequently (once per reservation, by admin only).

## Risks / Trade-offs

- **Data inconsistency between Stripe and DB**: If a Stripe payment updates after the reservation is modified in the DB, payment data could drift. Mitigation: Stripe webhook already syncs payment status to the DB; admin edits do not modify payment fields.
- **Phone number formatting**: `wa.me` links require international format (no +, no spaces). Mitigation: Reuse the `formatPhoneNumber` logic from `whatsapp.ts` as a shared utility.
- **Concurrent edits**: Two admins editing the same reservation simultaneously could overwrite each other. Mitigation: Acceptable risk given the small admin team. The `updated_at` column can be used for optimistic locking if needed later.
- **No undo for delete**: Hard delete is irreversible. Mitigation: Confirmation dialog with reservation ID and customer name displayed.
