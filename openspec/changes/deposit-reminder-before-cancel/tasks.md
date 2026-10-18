## 1. Backend
- [x] 1.1 `PAYMENT_GRACE_HOURS` and `payment_reminder_sent_at` column (migration 032 + runtime)
- [x] 1.2 `sendDepositReminders()` (atomic mark, extend deadline and tokens, email)
- [x] 1.3 `expireUnpaidReservations` requires the reminder
- [x] 1.4 Cron endpoint and lazy callers run expire + reminders

## 2. Copy
- [x] 2.1 `depositReminderEmail` template
- [x] 2.2 Approval/request emails, wizard step 4, terms (new version), cancellation reason

## 3. Verify
- [x] 3.1 Tests for the reminder email
- [x] 3.2 Typecheck and tests pass
