## Why

La inauguración se mueve del 16/10 al 18/10/2026.

## What Changes

- Inauguración el **18/10/2026**; reservas desde el **19/10/2026** (el día de la inauguración no se alquila, como hasta ahora).
- Cuenta atrás, popup de entrada y validación de reservas (calendario y API) usan las nuevas fechas.

## Capabilities

### Modified Capabilities

- `opening-date`: nueva fecha de inauguración e inicio de reservas.

## Impact

- `src/config/opening.ts` (única fuente de las fechas; el resto de la web las lee de ahí).
- Solicitudes ya existentes para el 17 o 18/10 hay que reubicarlas a mano.
