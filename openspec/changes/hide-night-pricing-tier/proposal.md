## Why

La franja nocturna (22:00 - 02:00) no está operativa actualmente y la columna "Noche" de la tabla de tarifas en la home siempre muestra "A consultar", lo cual genera confusión: parece una tarifa disponible cuando en realidad no se ofrece. Se quiere ocultar esa columna de la vista pública sin borrar los datos/lógica de precios nocturnos, por si se activa esa franja en el futuro.

## What Changes

- Ocultar la columna "Noche" (y su cabecera con horario 22:00 - 02:00) de la tabla de tarifas (`PricingTable`) que se muestra en la home
- Mantener intactos los campos de precio nocturno en la base de datos, en `src/utils/pricing.ts` / `pricingDb.ts` y en el resto de flujos (admin, reservas) que sigan usándolos

## Capabilities

### Modified Capabilities

- `pricing-table`: La tabla de tarifas pública ya no muestra la franja nocturna, aunque los datos siguen existiendo en el sistema

## Impact

- **Frontend**: `src/components/PricingTable.tsx` — se elimina la columna "Noche" del `<thead>` y del `<tbody>`, y el campo `night` de la fila de datos
- No hay cambios de backend, DB, ni en `src/utils/pricing.ts` / `pricingDb.ts` — los precios de la franja nocturna se conservan tal cual
