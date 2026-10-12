## Why

Se actualiza la parrilla de precios del espacio. Además de subir las tarifas, cambia la regla de festivos: ahora **festivos y vísperas de festivo** se tratan igual y su precio es "A consultar" en ambas franjas. Hasta ahora la víspera solo afectaba a la tarde (con precio de viernes) y los festivos tenían precio fijo de fin de semana.

Nueva parrilla:

| Día                  | Mañana (10-14h) | Tarde (16-20h) |
|----------------------|-----------------|----------------|
| Lunes a jueves       | 120 €           | 130 €          |
| Viernes              | 120 €           | 180 €          |
| Sábados y domingos   | 160 €           | 200 €          |
| Festivos y vísperas  | A consultar     | A consultar    |

## What Changes

- Nuevos precios en `pricing_rules` (migración `025_update_pricing_grid_2026.sql`) y en los fallbacks hardcodeados.
- Festivos **y vísperas** usan las reglas `holiday_morning` / `holiday_afternoon` (precio 0 = "A consultar"), con prioridad sobre fin de semana y viernes.
- La resolución "fecha + franja → regla → precio" se centraliza en `src/utils/pricing.ts` (`getPricingRuleKey`, `resolvePriceFromRules`); se elimina la lógica duplicada en 5 componentes.
- **BREAKING (bugfix)**: un precio 0 o ausente ya no cae a 110 € (`pricing[key] || 110`); pasa a "A consultar". Sin esto, un festivo se cobraría 110 €.
- `isHoliday` compara la fecha **local** (antes `toISOString()`, que en España desplaza un día las fechas del calendario y marcaba como festivo el día siguiente).
- El flujo de reserva bloquea las fechas "A consultar" con un mensaje genérico (antes era específico de la franja nocturna).
- Tabla pública: fila "Festivos y vísperas".

## Capabilities

### Modified Capabilities

- `pricing`: nueva parrilla y regla de festivos/vísperas a consultar.

## Impact

- **DB**: `database/migrations/025_update_pricing_grid_2026.sql` (UPDATE de 7 filas en `pricing_rules`). Alternativa: editar en `/admin/pricing`.
- **Frontend**: `PricingTable.tsx`, `disponibilidad.tsx`, `ReservationForm.tsx`, `booking/Step1Calendar.tsx`, `booking/Step2Configuration.tsx`.
- **Utils**: `src/utils/pricing.ts`, `src/utils/pricingDb.ts`.
- **Docs**: `docs/project_notes/key_facts.md`.
