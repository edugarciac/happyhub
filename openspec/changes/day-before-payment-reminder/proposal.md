## Why

Hoy, 3 días antes del evento, se envía un correo con un enlace que cobra solo el resto. El propietario quiere (decisión del 2026-11-06):

- Un único aviso, **el día antes del evento**, recordando que hay que pagar antes de empezar.
- Que ese pago incluya el **resto y el bloqueo de la fianza de 150 €**, los dos por la pasarela (Stripe). El bloqueo online dura 7 días, así que hacerlo el día antes o el mismo día deja margen para revisar el espacio.
- **No contar con el datáfono** para el resto ni para la fianza.

## What Changes

- Se elimina el recordatorio de 3 días antes (`remaining_advance`, solo el resto).
- Nuevo recordatorio automático el día antes del evento: correo con un enlace `remaining_payment` (el mismo del «Cobro del día»: resto + fianza), válido hasta el final del día del evento. Si se confirma una reserva el mismo día del evento sin aviso, se envía en la siguiente ejecución.
- El datáfono desaparece de los textos para el cliente (términos, PDF del contrato, correo de confirmación) y de las opciones del admin («Cobro del día» y «Marcar pago total»).
- Los enlaces `remaining_advance` ya enviados siguen funcionando hasta que caducan. Los datos históricos con datáfono se siguen mostrando y gestionando (liberar fianza, devoluciones).

## Impact

- `src/lib/reservationFlow.ts` (`sendDayBeforePaymentReminders`, columna `day_before_reminder_sent_at`)
- `src/lib/emailTemplates.ts` (`dayBeforePaymentEmail`; fuera `remainingPaymentReminderEmail`; texto del correo de confirmación)
- `src/config/payments.ts`, `src/utils/reservationStatus.ts`
- `src/components/admin/DayOfPaymentModal.tsx`, `src/components/admin/ReservationFlowGuide.tsx`, `src/pages/api/admin/reservations/[id]/mark-remaining-paid.ts`
- `src/components/TermsContent.tsx`, `src/lib/pdf.ts`
- Migración `database/migrations/035_day_before_payment_reminder.sql`
