## Why

Queremos premiar a quien reserve pronto: un 10% de descuento para quien solicite su reserva el día de la inauguración o antes. La inauguración es el 18/10 (cambio `move-opening-to-oct-18`).

## What Changes

- **Descuento inauguración: 10% sobre el alquiler** (no sobre extras) para solicitudes hechas hasta el 18/10/2026 (hora de Madrid) con fecha de evento hasta el 30/12/2026.
- La reserva muestra la línea de descuento en el resumen; total y señal (30%) se calculan ya descontados.
- El servidor comprueba con su propia hora que la promoción sigue activa; si el cliente envía un descuento fuera de plazo, rechaza la solicitud.
- Emails (cliente y admin) muestran el descuento aplicado.
- La tabla de tarifas muestra un aviso de la promoción mientras está activa.
- El popup de inauguración y la tarjeta de cuenta atrás de la portada anuncian el descuento.
- Solicitudes ya existentes: se aplica el descuento a mano desde el panel de admin, con una consulta SQL para listarlas (no se guarda el desglose de extras en BD, así que no se puede recalcular automáticamente sin riesgo).

## Capabilities

### New Capabilities

- `opening-discount`: descuento por reserva anticipada a la inauguración.

## Impact

- **Config**: nuevo `src/config/promotions.ts`.
- **Frontend**: `BookingContext`, `PriceSummary`, `Step3CustomerData`, `PricingTable`.
- **Backend**: `src/pages/api/webhook-reserva.ts`, `src/lib/emailTemplates.ts`.
- **Sin migración de BD**: el descuento queda reflejado en `total_price`/`deposit_amount`.
