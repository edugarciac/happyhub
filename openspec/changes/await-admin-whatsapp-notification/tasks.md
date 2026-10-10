## 1. Implement

- [x] 1.1 `notifyAdminSafely` helper with await + 5 s timeout + log
- [x] 1.2 Use it in both n8n and mock branches of `webhook-reserva`

## 2. Owner configuration

- [ ] 2.1 Set `ADMIN_WHATSAPP_NUMBER` in Vercel (Production) and redeploy
- [ ] 2.2 Check n8n execution of 2026-10-10 08:49 UTC: Gmail / Google Calendar credentials
- [ ] 2.3 n8n Webhook node response mode → "Using 'Respond to Webhook' node"

## 3. Verify

- [x] 3.1 `tsc` clean, Jest 140/140
- [ ] 3.2 New test reservation: WhatsApp to admin + emails received
