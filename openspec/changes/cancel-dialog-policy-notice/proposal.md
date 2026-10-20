## Why

Al cancelar, el admin debe ver claramente qué implica según la política (Condiciones, apartado 5): con 15 días o más se devuelve el importe; entre 14 y 3 días no se devuelve la señal pero se puede cambiar la fecha; con menos de 3 días ni devolución ni cambio de fecha. Hoy el aviso solo aparece si hay pagos y no menciona el cambio de fecha.

## What Changes

- La ventana de "Cancelar" muestra siempre un aviso según el tramo (`cancellationTier`):
  - **≥15 días** (verde): "se devuelve el importe pagado (X €)", con la casilla de devolución marcada
  - **14–3 días** (ámbar): "no se devuelve la señal; el cliente puede cambiar la fecha; si cancelas, perderá la señal", con botón **"Cambiar la fecha en lugar de cancelar"** que abre la edición de la reserva
  - **<3 días o fecha pasada** (rojo): "no se devuelve la señal ni se puede cambiar la fecha"
- Fuera del tramo de devolución, la casilla pasa a "Devolver igualmente (X €) · excepción o fuerza mayor" (desmarcada)
- El botón para cerrar la ventana pasa de "Cancelar" a "Volver", para no confundirlo con la acción

## Capabilities

### Modified Capabilities

- `reservation-cancellation`: aviso de la política en la ventana de cancelación

## Impact

- **Frontend**: `src/pages/admin/reservations/index.tsx`, `src/utils/cancellationPolicy.ts` (`cancellationTier`)
