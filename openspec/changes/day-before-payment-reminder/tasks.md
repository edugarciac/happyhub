## 1. Backend
- [x] 1.1 Eliminar el recordatorio de 3 días (`sendRemainingPaymentReminders`, plantilla, constante)
- [x] 1.2 Migración 035 + columna `day_before_reminder_sent_at` en runtime
- [x] 1.3 `sendDayBeforePaymentReminders()` en `processUnpaidReservations`

## 2. Copy
- [x] 2.1 `dayBeforePaymentEmail`
- [x] 2.2 Quitar el datáfono de términos, PDF y correo de confirmación

## 3. Admin
- [x] 3.1 Quitar el datáfono de «Cobro del día» y «Marcar pago total»
- [x] 3.2 Actualizar la guía del flujo

## 4. Verify
- [x] 4.1 Tests del correo
- [x] 4.2 Typecheck y tests pasan
