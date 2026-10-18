## Why

En la reserva manual, el total solo suma o resta las horas y los servicios; el alquiler base hay que escribirlo a mano. El admin tiene que buscar la tarifa del día y la franja, y puede equivocarse.

## What Changes

- Nuevo endpoint de admin `POST /api/admin/reservations/quote` que devuelve el precio con `computeReservationPrice` (tarifa vigente de `pricing_rules` según día y franja, festivo/víspera, descuento de inauguración, horas adicionales y servicios). Es la misma función que usa la reserva web.
- La reserva manual pide el precio cada vez que cambian fecha, franja, horas o servicios, y rellena el total y la señal (30%), con el desglose debajo.
- Si la tarifa es "A consultar", se avisa y el precio queda manual.
- El admin puede seguir sobrescribiendo el total y la señal a mano (se recalculan si vuelve a cambiar fecha, franja, horas o servicios).

## Impact

- Nuevo `src/pages/api/admin/reservations/quote.ts`
- `src/pages/admin/reservations/create.tsx`
