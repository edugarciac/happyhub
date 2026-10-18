## Why

El resto de la reserva (total − señal) solo se cobra el día del evento, con el QR que genera el admin. No hay ningún aviso previo al cliente, y todo el cobro se concentra justo antes de empezar.

## What Changes

- Tres días antes del evento se envía un correo al cliente recordando que el resto debe estar abonado antes del evento, con un enlace de pago con tarjeta (Stripe). Usa la misma plantilla que el resto de correos de reserva.
- El enlace del correo cobra **solo el resto**. La fianza de 150 € se sigue bloqueando el día del evento (QR o datáfono): un bloqueo online dura 7 días, y hacerlo 3 días antes dejaría muy poco margen para revisar el espacio.
- Se envía una sola vez por reserva, solo a reservas confirmadas con resto pendiente. Si la reserva se confirma con menos de 3 días, se envía en la siguiente ejecución del cron.
- Lo ejecuta el cron diario (07:00 UTC) y el listado de reservas del admin.

## Impact

- `src/lib/reservationFlow.ts` (`sendRemainingPaymentReminders`, columna `remaining_reminder_sent_at`)
- `src/lib/emailTemplates.ts` (`remainingPaymentReminderEmail`)
- `src/pages/api/payments/remaining.ts`, `src/pages/pagar/[token].tsx`, `src/pages/api/stripe-webhook.ts` (enlace `remaining_advance`)
- Migración `database/migrations/034_remaining_payment_reminder.sql`
