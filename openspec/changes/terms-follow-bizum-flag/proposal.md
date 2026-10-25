## Why

Bizum está desactivado (`BIZUM_ENABLED = false`, cambio `disable-bizum-temporarily`), pero los términos que el cliente acepta al reservar y el contrato que genera el admin siguen diciendo que la señal se puede pagar con Bizum. Un cliente podría reclamarlo.

## What Changes

- Términos (`TermsContent`): las menciones a Bizum (paso de aprobación, tabla de pagos) solo aparecen si `BIZUM_ENABLED`. Con Bizum apagado la señal se paga con tarjeta, y las filas de resto y fianza dicen "solo tarjeta" sin nombrar Bizum.
- Contrato del admin (`/admin/reservations/[id]/contract`): la forma de pago de la señal sale de la reserva (`payment_method`). Una reserva antigua pagada por Bizum sigue diciendo Bizum; una nueva dice tarjeta.

## Capabilities

### Modified Capabilities

- `booking-terms`: formas de pago según `BIZUM_ENABLED`

## Impact

- `src/components/TermsContent.tsx`, `src/pages/admin/reservations/[id]/contract.tsx`
