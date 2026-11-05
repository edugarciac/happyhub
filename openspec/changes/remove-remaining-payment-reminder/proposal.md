## Why

El correo de «paga el resto» 3 días antes del evento (cambio `remaining-payment-reminder`) no encaja con cómo se quiere cobrar: el resto se paga el día del evento, justo antes de empezar, junto con el bloqueo de la fianza de 150 € (que se libera a los pocos días). Adelantar el pago separa los dos cobros y confunde al cliente.

## What Changes

- Se deja de enviar el correo de recordatorio del resto 3 días antes del evento.
- El cobro sigue siendo el del día del evento: QR/enlace del admin (`remaining_payment`) o datáfono, resto + fianza.
- Los enlaces `remaining_advance` ya enviados siguen funcionando hasta que caducan (final del día del evento): se mantiene su soporte en la API, la página y el webhook.
- La guía del flujo del admin deja de mostrar ese paso automático.

## Impact

- `src/lib/reservationFlow.ts` (se elimina `sendRemainingPaymentReminders` y su llamada en `processUnpaidReservations`)
- `src/lib/emailTemplates.ts` (se elimina `remainingPaymentReminderEmail`) y su test
- `src/config/payments.ts` (se elimina `REMAINING_REMINDER_DAYS_BEFORE`)
- `src/components/admin/ReservationFlowGuide.tsx`
- Sin migración: la columna `remaining_reminder_sent_at` se queda (sin uso).
