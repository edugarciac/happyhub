## Context

The booking wizard (`src/components/booking/BookingWizard.tsx`, via `BookingContext.tsx`) has 4 steps; Step 3 (`Step3CustomerData.tsx`) already has a zod-validated form (`customerSchema`) with `eventType`/`paymentMethod` enums and an `acceptTerms` checkbox, and is the step that actually submits to `POST /api/webhook-reserva` (not Step 4, which is summary/payment only). `webhook-reserva.ts` is a thin proxy — it forwards the payload to n8n, which does the real `INSERT INTO reservations` in its `GuardarEnNeonDB` node. Admin-created reservations go through a separate direct-DB path in `src/pages/api/admin/reservations.ts`.

There's no existing precedent for a customer-facing yes/no *operational* flag (as opposed to a priced extra, which uses `selectedExtras: string[]`) — this introduces that pattern for the first time.

## Goals / Non-Goals

**Goals:**
- Capture the yes/no answer at booking time with a clear, honest explanation (no price/capacity implication).
- Get it in front of ops as early as possible — ideally the same WhatsApp notification that already tells them a reservation came in.
- Let admin correct/set it after the fact, since a customer might not notice the checkbox or ops might need to override it.

**Non-Goals:**
- No price change — explicitly a free operational request, not an extra.
- No customer-facing contract mention — internal only.
- No capacity/guest-count validation tied to the 25-30 chair figure — this is a simple yes/no, not an inventory system.

## Decisions

### 1. Simple boolean column, not a JSON "extras" style field

**Decision**: `needs_kids_furniture BOOLEAN NOT NULL DEFAULT FALSE` directly on `reservations`, not folded into the existing `extras`/`selectedExtras` mechanism.

**Rationale**: `selectedExtras` is customer-facing, priced, and rendered in the booking summary/contract as a line item — mixing an internal ops flag into it would risk it leaking into the contract PDF or price calculation by accident. A dedicated column keeps the two concerns (paid extras vs. internal prep flags) structurally separate, and follows the existing boolean-column precedent (`active`, `completed`, `is_published` in other migrations).

### 2. Checkbox in Step 3, not a new wizard step

**Decision**: Add the question inline in `Step3CustomerData.tsx`, near the message/notes field, not as a new Step 5 or a Step 2 (Configuration) addition.

**Rationale**: Step 2 is for priced extras and guest count — adding a free-form ops question there would misleadingly suggest it affects pricing. Step 3 already collects free-text `message` and is the step that assembles the final payload sent to `webhook-reserva.ts`, so it's the natural home for one more low-friction yes/no field without adding wizard steps.

### 3. Persisted via the n8n workflow, following existing precedent

**Decision**: Same mechanism as every other booking field — `Step3CustomerData.tsx` includes `needsKidsFurniture` in the POST body, `NormalizarDatos` reads it, `GuardarEnNeonDB`'s INSERT includes it.

**Rationale**: Consistency with how every other reservation field already flows through the system; introducing a parallel direct-DB write path just for this one field would be more complex for no benefit, and the reservation record needs to stay a single source of truth assembled in one place.

### 4. Admin visibility: list (editable) + approval detail (highlighted), not a separate ops dashboard

**Decision**: A small badge/checkbox in `src/pages/admin/reservations/index.tsx`'s existing edit form, and a highlighted badge in `src/pages/admin/approve-reservation/[id].tsx`'s detail view (next to where `notes` already renders).

**Rationale**: Reuses existing admin surfaces ops already checks for every reservation, rather than building a new "furniture prep" dashboard for a single boolean flag — proportionate to the size of the feature.

### 5. Include in the reservation-request WhatsApp notification, only when true

**Decision**: `notifyAdminReservationRequest()` (from `fix-whatsapp-reservation-notification`) appends a `🪑 Mesas/sillas niños: Sí` line only when the flag is set; omitted entirely when false, to keep the message short for the common case.

**Rationale**: This is currently the fastest way ops learns about a new reservation at all — surfacing the flag there means they can plan the storage-room prep immediately instead of waiting to check the admin panel.

## Risks / Trade-offs

- **n8n workflow must be manually re-imported** — same limitation as every other n8n-touching change in this project; the JSON edit in the repo has zero effect on the live workflow until re-imported.
- **Admin-created reservations** (`src/pages/api/admin/reservations.ts` direct-DB path) don't go through the booking wizard, so the flag defaults to `false` there unless explicitly added to that form too — included in scope, but worth confirming admin actually wants to set this when creating reservations manually (rare path).
