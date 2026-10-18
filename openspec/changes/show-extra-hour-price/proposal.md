## Why

La ampliación de la franja de tarde (hasta las 23:00h) se mostraba como "Consúltanos la tarifa". El precio es fijo: **60 € por cada hora adicional**, y debe quedar muy claro en el pie de la tabla de precios y en las preguntas frecuentes.

## What Changes

- `AFTERNOON_EXTENSION_NOTE` en `src/utils/pricing.ts` indica explícitamente "60 € por cada hora adicional" (se usa en el pie de `PricingTable`, en `FullCalendar` y en `/disponibilidad`)
- Nueva constante `EXTRA_HOUR_PRICE = 60` como fuente única del precio
- FAQ en `src/pages/como-funciona.tsx`: las respuestas sobre franjas y ampliación de horario indican el precio de 60 €/hora
- El acceso anticipado (30 €) no cambia

## Capabilities

### Modified Capabilities

- `pricing-time-slots`: el precio de la hora adicional de ampliación (60 €) se muestra en la tabla de precios y en la FAQ

## Impact

Solo textos visibles. Sin cambios de lógica de cobro, BD ni API.
