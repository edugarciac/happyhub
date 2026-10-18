## Why

El listado de reservas del admin se ordena por fecha del evento, así que las reservas recién creadas no salen arriba. Además solo muestra el día de creación, no la hora.

## What Changes

- El listado se ordena por código de reserva (`id`) decreciente: la última creada sale primero.
- Bajo el código se muestra la fecha y la hora de creación (dd/mm/aaaa hh:mm, hora de Madrid).

## Impact

- `src/pages/api/admin/reservations.ts` (ORDER BY)
- `src/pages/admin/reservations/index.tsx` (formato de la fecha de creación)
