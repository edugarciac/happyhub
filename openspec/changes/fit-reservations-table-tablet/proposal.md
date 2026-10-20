## Why

En el iPad Pro en horizontal (1194px el de 11", 1366px el de 13") la tabla de reservas obliga a hacer scroll horizontal: con 8 columnas y textos sin salto de línea mide ~1725px y solo hay 890px (11") o 1062px (13") disponibles junto al menú lateral.

## What Changes

- La tabla pasa de 8 a 5 columnas sin perder información:
  - **Reserva** = ID + fecha de creación + cliente + email (recortado, completo en tooltip) + teléfono
  - **Evento** = fecha/franja + personas + tipo + horas extra + extras + mesas/sillas niños
  - **Pago** = igual que "Precio", con los textos largos (pendiente de señal, pago denegado) en varias líneas
  - **Estado** = etiqueta de estado + botones de cambio de estado debajo
  - **Acciones** = sin cambios
- Celdas con `px-3` y alineadas arriba

## Capabilities

### Modified Capabilities

- `admin-reservations`: la tabla cabe sin scroll horizontal en tablet horizontal

## Impact

- **Frontend**: `src/pages/admin/reservations/index.tsx`
