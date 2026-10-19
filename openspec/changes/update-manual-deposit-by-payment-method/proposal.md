## Why

La acción "Señal recibida (Bizum)" aparece en todas las reservas aprobadas sin señal, también en las que el cliente paga con tarjeta. Con tarjeta, el webhook de Stripe confirma la reserva automáticamente, así que el botón confunde y permite confirmar una reserva sin cobro real.

## What Changes

- Reservas con método **Bizum**: se mantiene "Señal recibida (Bizum)" al principio del grupo Pagos, con el mismo aviso de confirmación
- Reservas con método **tarjeta** (cualquier método distinto de Bizum, igual que el resto de la pantalla): la acción pasa a "Marcar señal pagada (manual)", al final del grupo Pagos, con icono gris y un aviso que explica que se confirma sola al pagar y que solo debe usarse si el cliente ha pagado por otra vía
- Sin cambios en la API `mark-deposit-paid`

## Capabilities

### Modified Capabilities

- `admin-reservations`: la acción manual de señal depende del método de pago

## Impact

- **Frontend**: `src/pages/admin/reservations/index.tsx`
