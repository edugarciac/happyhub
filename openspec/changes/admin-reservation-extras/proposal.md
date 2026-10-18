## Why

La reserva por calendario permite añadir horas adicionales (20:00–23:00h, 60 €/hora) y servicios del catálogo, pero la reserva manual del admin y la edición de reservas no. El admin no puede reflejar lo que el cliente pide por teléfono/WhatsApp, y el Calendar no se alarga.

## What Changes

- Reserva manual y modal de edición: selector de horas adicionales (0–3, solo tarde) y casillas con los servicios del catálogo.
- Al cambiar horas o servicios, el precio total se ajusta con la diferencia (el admin puede seguir editándolo a mano). En la reserva manual también la señal (30%).
- Nueva columna `reservations.extras` (JSONB) con id, título y precio de cada servicio en el momento de reservar. La reserva web también la rellena.
- La API valida las horas (`isValidExtraHours`) y los servicios contra `service_catalog`.
- Al editar fecha, franja u horas, se actualiza el evento de Google Calendar.
- El listado del admin y la descripción del evento de Calendar muestran los servicios.

## Impact

- `src/pages/admin/reservations/create.tsx`, `src/pages/admin/reservations/index.tsx`
- Nuevo `src/components/admin/ReservationExtrasFields.tsx`, `src/lib/reservationExtras.ts`
- `src/pages/api/admin/reservations.ts`, `src/pages/api/admin/reservations/[id]/index.ts`, `src/pages/api/webhook-reserva.ts`
- `src/lib/googleCalendar.ts`, `src/lib/reservationNotifications.ts`, `src/lib/reservationFlow.ts`
- Migración `database/migrations/031_reservation_extras.sql`
