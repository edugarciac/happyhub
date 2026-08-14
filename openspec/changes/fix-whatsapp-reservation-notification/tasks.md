# Tasks: fix-whatsapp-reservation-notification

## T1 — WhatsApp helper
- [x] Export `TIME_SLOT_LABELS` from `src/lib/whatsapp.ts`
- [x] Add `notifyAdminReservationRequest()` with distinct "Nueva solicitud de reserva" wording

## T2 — Wire into reservation creation
- [x] Call `notifyAdminReservationRequest()` after successful n8n response in `webhook-reserva.ts`
- [x] Call it after the mock-response path too

## Verification
- [ ] Submit a test reservation (any payment method) against production and confirm the admin WhatsApp number receives "Nueva solicitud de reserva"
- [ ] Submit a card reservation through to Stripe payment success and confirm the admin receives both messages, correctly worded, not duplicated
- [ ] Confirm a WhatsApp send failure (e.g. temporarily wrong `ADMIN_WHATSAPP_NUMBER`) doesn't break reservation creation for the customer
