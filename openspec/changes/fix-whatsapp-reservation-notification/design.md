## Context

`src/pages/api/webhook-reserva.ts` is a thin proxy: it validates required fields, forwards the booking payload to n8n (`N8N_WEBHOOK_URL`), and returns n8n's response (or a mock response in dev). The actual `INSERT INTO reservations` happens inside n8n's `GuardarEnNeonDB` node, not in this Next.js route. By the time `axios.post(n8nWebhookUrl, ...)` resolves without `n8nData?.success === false`, the reservation is already persisted — n8n's workflow order is Webhook → NormalizarDatos → VerificarDisponibilidad → GuardarEnNeonDB → CrearEventoCalendar → Gmail nodes → respond, so a successful response implies the DB write completed.

`src/lib/whatsapp.ts` already has the primitives needed (`sendAdminNotification(message: string)`, `TIME_SLOT_LABELS`) — this is additive, not a rework of the WhatsApp integration.

## Goals / Non-Goals

**Goals:**
- Admin gets notified by WhatsApp the moment any reservation request comes in, regardless of payment method.
- Don't duplicate/confuse the existing payment-success notification wording.
- No dependency on editing/re-importing n8n workflows.

**Non-Goals:**
- Fixing the separate, pre-existing bug where `notifyN8n()` string-concatenates `N8N_WEBHOOK_URL + path` (`src/lib/apiMiddleware.ts`), which likely breaks the *approval/rejection* n8n WhatsApp notifications if `N8N_WEBHOOK_URL` includes the `/reservation-request` suffix as documented in `.env.example`. Out of scope — different code path, would need someone to confirm the actual deployed env var value first.
- Reconciling the two divergent n8n workflow JSON files in the repo (`n8n-reserva-neon-whatsapp.json` vs `reservation-approval-flow.json`) — not touched by this change.
- Customer-facing notification changes — `sendReservationConfirmation` (customer, on payment success) is untouched.

## Decisions

### 1. Fire from `webhook-reserva.ts`, not from n8n

**Decision**: Add the WhatsApp call to the Next.js route, right after a successful n8n response, rather than adding a node to the n8n workflow.

**Rationale**: Code here deploys via the normal `git push` → Vercel pipeline already in use throughout this session, is directly testable via Vercel's runtime logs, and doesn't require the admin to manually re-import a workflow JSON into a live n8n instance (unlike DB migrations, there's no way to verify n8n workflow state from this environment at all). Keeping the fix in code the team already reviews and deploys is strictly safer here.

### 2. New function, not reusing `notifyAdminNewReservation`

**Decision**: `notifyAdminReservationRequest()` is a new function with "Nueva solicitud de reserva" wording, called at creation time. `notifyAdminNewReservation()` (existing, "Nueva Reserva Confirmada") stays exactly as-is, still called only from `stripe-webhook.ts` on payment success.

**Rationale**: For card reservations, both will now fire in sequence (request → shortly after, payment confirmed) — using the same "Confirmada" wording for both would make the first message inaccurate (nothing is confirmed yet, it's pending review/payment) and the second redundant-sounding. Distinct wording makes each message accurate for the moment it represents.

### 3. Fire-and-forget, doesn't block or fail the reservation

**Decision**: `notifyAdminReservationRequest(...).catch(err => console.error(...))` — not awaited before responding to the client, and a failure here never fails the reservation request itself.

**Rationale**: Matches the existing pattern for `sendAdminNotification` elsewhere in the codebase (e.g. the feedback widget) and the existing behavior of `sendAdminNotification` itself, which already no-ops gracefully if `ADMIN_WHATSAPP_NUMBER` isn't configured. A WhatsApp delivery failure should never be the reason a customer's booking submission fails.

## Risks / Trade-offs

- **Env var dependency unverified**: this fix assumes `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN` / `ADMIN_WHATSAPP_NUMBER` are correctly configured in Vercel's production environment (they're required by the pre-existing payment-success notification too, so likely already set, but not directly verifiable from this sandbox — worth a manual test reservation after deploy).
- **Mock path also notifies**: the `/api/webhook-reserva-mock` dev/test branch also fires the real WhatsApp call. Acceptable — it already exercises the same code path deliberately, and `sendAdminNotification` is safely no-op without configured credentials in a dev environment.
