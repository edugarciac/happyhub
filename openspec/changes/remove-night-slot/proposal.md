## Why

El propietario ha decidido, con urgencia, dejar de ofrecer la franja de noche (22:00–02:00). Solo se ofrecen mañana (10:00–14:00) y tarde (16:00–20:00).

## What Changes

- **Calendario** (`FullCalendar`, usado en `/disponibilidad` y en `/reservas`): sin la casilla "N" ni su leyenda
- **Textos públicos**: `/disponibilidad` (leyenda, franjas, tarifas), `/como-funciona` (FAQ de franjas y personal), tabla de precios de la portada (quitada "Apertura anticipada", que era una ventaja de la noche)
- **Validación**: el esquema de reserva del cliente solo acepta `morning` y `afternoon`. `POST /api/webhook-reserva` rechaza `night` con un 400
- **`/reservas?timeSlot=night`**: se ignora la preselección
- **Admin**: sin "Noche" en crear reserva, editar reserva, bloquear fechas, calendario y tipos de tarifa
- `getAvailableTimeSlotsWithPricing` devuelve solo franjas reservables (`BOOKABLE_TIME_SLOTS`)

## Se mantiene

- El valor `night` en el tipo `TimeSlot`, en las etiquetas de solo lectura (facturas, PDF, WhatsApp, página de pago, éxito, área privada, listados admin, export) y en el esquema admin. Así cualquier reserva antigua de noche se sigue mostrando y editando bien.

## Capabilities

### Modified Capabilities

- `time-slots`: solo mañana y tarde son reservables

## Impact

- Frontend público, panel admin, `webhook-reserva`, `utils/pricing.ts`, `utils/validators.ts`, tests de precios
- Sin migración de BD
