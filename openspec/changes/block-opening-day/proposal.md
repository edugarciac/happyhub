## Why

El 16 de octubre de 2026 es la inauguración y ese día no se alquila el local. Hasta ahora el calendario y la API aceptaban reservas desde el propio 16 (`opening-countdown-and-booking-start`).

Además, `webhook-reserva` solo comprobaba las reservas existentes, no las **fechas bloqueadas por el admin** (`blocked_slots`): el calendario las mostraba como ocupadas, pero una petición directa a la API podía reservarlas.

## What Changes

- Nueva fecha de inicio de reservas `BOOKINGS_FROM_DATE = '2026-10-17'` en `src/config/opening.ts`. La cuenta atrás sigue apuntando al 16 (`OPENING_DATE`).
- `FullCalendar`: los días anteriores al 17 aparecen no disponibles y el calendario se abre en el mes del 17.
- `webhook-reserva`: rechaza fechas anteriores al 17 ("Solo aceptamos reservas a partir del 17 de octubre") y no inserta si la franja está en `blocked_slots`.
- Popup de entrada: "Ya puedes reservar tu celebración a partir del 17 de octubre".

## Impact

- `src/config/opening.ts`, `FullCalendar.tsx`, `ComingSoonOverlay.tsx`, `webhook-reserva.ts`
- Las reservas de prueba que ya existen el día 16 hay que rechazarlas a mano desde el panel.
