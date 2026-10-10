## Why

HappyHub no abre de noche (ver `remove-night-slot`), pero la franja de tarde se puede alargar unas horas adicionales, hasta las 23:00h. Hay que comunicarlo donde se eligen franjas y donde se ven los precios.

## What Changes

- Texto único `AFTERNOON_EXTENSION_NOTE` en `utils/pricing.ts`: "La franja de tarde se puede ampliar unas horas adicionales, hasta las 23:00h. Consúltanos la tarifa."
- **Calendario de reserva** (`FullCalendar`, en `/disponibilidad` y `/reservas`): nota al pie con asterisco en la leyenda de "Tarde"
- **Tabla de precios** (portada): asterisco en la cabecera "Tarde 16:00 - 20:00*" y la nota al pie (sustituye al texto genérico de ampliación)
- **`/disponibilidad`**: la nota bajo "Tardes" en el bloque de franjas
- **`/como-funciona`**: FAQ de franjas ("No abrimos de noche, pero la tarde se puede ampliar hasta las 23:00h") y FAQ de ampliación

## Non-Goals

- No se crea una franja ni un extra reservable online: la ampliación se gestiona a petición, como hasta ahora.

## Impact

- `utils/pricing.ts`, `FullCalendar.tsx`, `PricingTable.tsx`, `disponibilidad.tsx`, `como-funciona.tsx`
