## Why

The venue has ~25-30 children's chairs and 3 matching tables in a storage room that staff must physically bring out before an event, but only if that event actually needs them. There's currently no way for a customer to signal this during booking, and no way for admin/ops to know ahead of time — they'd only find out on the day, or not at all. This is an internal operational prep flag, not a paid extra or a customer-facing commitment.

## What Changes

- Booking flow (Step 3 — customer data) gains a yes/no question: "¿Necesitas mesas y sillas para niños?" with a short explanatory note (no price impact, no effect on capacity).
- The answer is persisted as a boolean (`needs_kids_furniture`) on the reservation, threaded through the existing n8n reservation-creation workflow.
- Admin sees the flag clearly in both the reservations list (editable, in case it's missed at booking time) and the approval detail page (highlighted, since ops needs to see it early).
- The admin "new reservation" WhatsApp notification (from `fix-whatsapp-reservation-notification`) includes a line when the flag is set, since that's the fastest way ops currently learns about a new reservation at all.
- Explicitly NOT added to the customer-facing PDF contract — this is an internal prep task, not a contractual line item.

## Capabilities

### New Capabilities
- `kids-furniture-request`: customer can flag during booking that children's tables/chairs need to be prepared; admin/ops sees it in time to act

## Impact

- **Database**: new `needs_kids_furniture BOOLEAN NOT NULL DEFAULT FALSE` column on `reservations` (migration `database/migrations/020_add_needs_kids_furniture.sql`, already written)
- **Frontend**: `src/components/booking/BookingContext.tsx` (new state field), `src/components/booking/Step3CustomerData.tsx` (checkbox + payload), `src/pages/admin/reservations/index.tsx` (list column/badge + edit toggle), `src/pages/admin/approve-reservation/[id].tsx` (highlighted detail badge)
- **Backend**: `src/pages/api/webhook-reserva.ts` (payload passthrough), `src/pages/api/admin/reservations.ts` (SELECT/response mapping, PATCH for edits), `src/lib/whatsapp.ts` (`notifyAdminReservationRequest` gains an optional line)
- **n8n**: `n8n/n8n-nodes/n8n-reserva-neon-whatsapp.json` — `NormalizarDatos` reads `body.needsKidsFurniture`, `GuardarEnNeonDB` inserts it. **Requires manually re-importing this workflow into the live n8n instance** — editing the JSON in the repo does not update it automatically (same caveat as every other n8n change in this project).
- **Out of scope**: `src/lib/pdf.ts` contract generation — deliberately not touched, per the internal-only nature of this flag
