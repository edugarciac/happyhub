## Why

"Cancelar y quitar del calendario" duplica el botón "Cancelar" y depende de Google Calendar y n8n, que ya no se usan. Además no pide motivo ni envía email al cliente, aunque su aviso dice que sí, así que puede dejar a clientes sin saber que su reserva se ha cancelado.

## What Changes

- Eliminar la acción "Cancelar y quitar del calendario" del menú "Más" del listado de reservas, junto con su modal y su estado
- Eliminar el endpoint `DELETE /api/admin/reservations/[id]/cancel-full`
- La cancelación queda solo con el botón "Cancelar" (motivo obligatorio + email al cliente)

## Capabilities

### Modified Capabilities

- `admin-reservations`: una única forma de cancelar

## Impact

- **Frontend**: `src/pages/admin/reservations/index.tsx`
- **Backend**: se borra `src/pages/api/admin/reservations/[id]/cancel-full.ts`
- Fuera de alcance: las llamadas residuales a Google Calendar / n8n en `status.ts` (no hacen nada sin sus variables de entorno)
