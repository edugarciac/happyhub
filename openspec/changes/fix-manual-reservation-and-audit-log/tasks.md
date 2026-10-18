## 1. Fix manual reservation
- [x] 1.1 Create user with unusable bcrypt `password_hash`; case-insensitive email lookup; show error reason to admin

## 2. Audit log
- [x] 2.1 `src/lib/audit.ts`: `audit_events` table, `recordAuditEvent`, `withAudit`
- [x] 2.2 Migration `030_audit_events.sql`
- [x] 2.3 Instrument credentials/Google login (`src/lib/auth.ts`) and registration
- [x] 2.4 Instrument `webhook-reserva` and admin reservations POST

## 3. Verify
- [x] 3.1 Unit tests for audit helper; typecheck and tests pass
