## 1. Libraries

- [x] 1.1 `lib/mailer.ts` (Resend REST, `EMAIL_FROM`, `ADMIN_EMAILS`)
- [x] 1.2 `lib/emailTemplates.ts` (escapeHtml, confirmation, admin, reset, cancellation)
- [x] 1.3 `lib/googleCalendar.ts` (create/delete reservation event with service account)

## 2. Endpoints

- [x] 2.1 `webhook-reserva`: atomic insert, calendar, emails, WhatsApp; no n8n
- [x] 2.2 `lib/email.ts`: verification + invitation via Resend (n8n fallback)
- [x] 2.3 `auth/reset-password`: Resend
- [x] 2.4 `admin/reservations/[id]/status`: cancellation/rejection email + calendar delete

## 3. Verify

- [x] 3.1 Unit tests for templates/escaping and reservation id
- [x] 3.2 `tsc`, Jest (146/146)
- [x] 3.2b Reservation SQL verified with pg-mem: atomic slot check, rejected slot reusable, injection stored as text, unique_slot → 23505 → 409
- [ ] 3.3 Prod test after `RESEND_API_KEY` + domain verification

## 4. Owner actions

- [ ] 4.1 `RESEND_API_KEY` in Vercel (Production)
- [ ] 4.2 Verify `happyhub.es` in Resend (DNS in Route 53)
- [ ] 4.3 Optional: share Google Calendar with the service account and set `GOOGLE_CALENDAR_ID`
