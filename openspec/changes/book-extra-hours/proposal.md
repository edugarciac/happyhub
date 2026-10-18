## Why

La franja de tarde (16:00–20:00h) se puede ampliar hasta las 23:00h a 60 € por hora, pero el proceso de reserva no lo permite: el cliente tiene que pedirlo aparte y el total que ve no incluye ese coste.

## What Changes

- Paso 2 del wizard: si la franja es tarde y tiene precio, el cliente puede elegir 0, 1, 2 o 3 horas adicionales (hasta 21:00, 22:00 o 23:00h), a 60 €/hora
- Resumen de precio, confirmación y emails: línea "Horas adicionales", hora de fin ampliada y total con las horas incluidas (la señal del 30% se calcula sobre ese total)
- API `webhook-reserva`: valida las horas (0–3, solo tarde), guarda `extra_hours` en `reservations`, alarga el evento de Google Calendar y lo incluye en la prueba de aceptación
- Panel admin: el listado muestra las horas adicionales de cada reserva
- El descuento de inauguración sigue aplicando solo al alquiler base, no a las horas adicionales

## Capabilities

### New Capabilities

- `booking-extra-hours`: reservar horas adicionales en la franja de tarde

## Impact

- `src/utils/pricing.ts`, `src/components/booking/*`, `src/pages/api/webhook-reserva.ts`, `src/lib/reservationFlow.ts`, `src/lib/googleCalendar.ts`, `src/lib/emailTemplates.ts`, `src/pages/api/admin/reservations.ts`, `src/pages/admin/reservations/index.tsx`
- BD: nueva columna `reservations.extra_hours INTEGER NOT NULL DEFAULT 0` (idempotente, en `ensureReservationFlowColumns`)
