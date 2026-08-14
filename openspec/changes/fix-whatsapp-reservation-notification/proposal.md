## Why

The admin doesn't receive a WhatsApp message when a customer creates a new reservation. Investigation found this was never wired anywhere: `src/lib/whatsapp.ts` exports `notifyAdminNewReservation`, but it's only called from `src/pages/api/stripe-webhook.ts` on card-payment success — not at reservation-creation time, and never at all for bizum/cash reservations (which don't go through Stripe). `src/pages/api/webhook-reserva.ts`, the actual reservation-creation endpoint, only proxies the booking payload to n8n and never calls any WhatsApp function. On the n8n side, the workflow actually wired to receive new reservations (`n8n/n8n-nodes/n8n-reserva-neon-whatsapp.json`, webhook path `reservation-request`) has zero WhatsApp nodes despite its filename — only Gmail nodes. A separate, unrelated workflow (`n8n/workflows/reservation-approval-flow.json`) does have WhatsApp nodes but listens on different webhook paths not called at creation time. `n8n/FLUJO_WHATSAPP_BUSINESS.md` already documented this as "pendiente workflow n8n" as of Feb 2026.

## What Changes

- `src/pages/api/webhook-reserva.ts` sends an admin WhatsApp notification immediately after a reservation is successfully created (both the real n8n path and the mock path), covering every payment method — not just card/Stripe.
- New `notifyAdminReservationRequest()` in `src/lib/whatsapp.ts`, distinct from the existing `notifyAdminNewReservation()` (which now exclusively represents the payment-success moment). Wording is "Nueva solicitud de reserva" rather than "Nueva Reserva Confirmada", so the admin isn't told twice that something is "confirmed" when a card reservation later triggers the existing payment-success message too.
- No changes to n8n workflows — the fix lives entirely in code Vercel already deploys, avoiding a dependency on manually re-importing n8n workflow JSON into the live n8n instance.

## Capabilities

### New Capabilities
- `admin-whatsapp-on-reservation-request`: admin gets a WhatsApp message the moment any reservation (any payment method) is created, before payment/approval

### Modified Capabilities
- None — `notifyAdminNewReservation` (payment-success notification) is unchanged in behavior, just no longer the only admin-facing reservation notification

## Impact

- **Backend**: `src/lib/whatsapp.ts` (new function, `TIME_SLOT_LABELS` exported for reuse), `src/pages/api/webhook-reserva.ts` (fire-and-forget call after both success paths)
- **No DB changes**
- **Requires existing env vars** (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `ADMIN_WHATSAPP_NUMBER`) to already be configured in Vercel — if they're missing, `sendAdminNotification` no-ops silently (logs "Admin WhatsApp number not configured") rather than failing the reservation request, consistent with existing behavior at payment-success time
