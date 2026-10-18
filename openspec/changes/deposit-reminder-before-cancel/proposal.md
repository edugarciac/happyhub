## Why

Hoy, si el cliente no paga la señal en las 24 horas siguientes a la aprobación, la reserva se cancela sin aviso previo. Se pierden reservas de clientes que simplemente lo olvidaron.

## What Changes

- A las 24 h sin pago **no se cancela**: se envía un correo recordatorio con el enlace de pago, diciendo que si no se abona en 24 horas más, la reserva se cancela.
- La cancelación se hace a las 48 h (24 h después del recordatorio), con el correo de cancelación actual.
- Nunca se cancela una reserva sin haber enviado antes el recordatorio (o haberlo intentado, si no tiene email).
- Un GitHub Action llama cada hora al cron `/api/cron/expire-reservations`, porque el cron de Vercel (plan Hobby) solo corre una vez al día.
- Textos actualizados: términos (versión nueva), correo de aprobación, correo de solicitud, paso 4 del wizard y motivo de cancelación.

## Impact

- `src/lib/reservationFlow.ts` (`sendDepositReminders`, condición de cancelación, columna `payment_reminder_sent_at`)
- `src/lib/emailTemplates.ts` (`depositReminderEmail`), `src/config/payments.ts`
- `src/pages/api/cron/expire-reservations.ts`, `.github/workflows/expire-reservations.yml`
- `src/components/TermsContent.tsx`, `src/components/booking/Step4Confirmation.tsx`
- Migración `database/migrations/032_payment_reminder.sql`
