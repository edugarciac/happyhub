## Why

El panel admin tiene una página de reservas con listado y filtros, pero carece de herramientas para gestionar el ciclo de vida completo de una reserva. Los administradores necesitan aprobar, cancelar (con motivo), reabrir y marcar como completadas las reservas directamente desde la UI, además de poder crear, editar y eliminar reservas manualmente.

## What Changes

- Añadir botones de acción en el listado de reservas para transiciones de estado (Aprobar, Cancelar, Pendiente, Evento Realizado)
- Modal con textarea obligatorio al cancelar para registrar el motivo
- Modales de confirmación para el resto de transiciones
- Nueva columna `cancellation_reason` en la tabla `reservations`
- Formulario admin para crear reservas manualmente
- Formulario admin para editar reservas existentes
- Confirmación antes de borrar reservas

## Capabilities

### New Capabilities

- `reservation-status-management`: Gestión de transiciones de estado desde la UI admin con modales de confirmación y motivo de cancelación
- `reservation-crud-ui`: Formularios admin para crear, editar y borrar reservas

### Modified Capabilities

_(ninguna — las APIs backend ya existen y soportan todas las operaciones)_

## Impact

- `src/pages/admin/reservations/index.tsx` — UI principal, botones de acción + modales
- `src/pages/admin/reservations/create.tsx` — nuevo formulario de creación
- `src/pages/admin/reservations/[id]/edit.tsx` — nuevo formulario de edición
- `src/pages/api/admin/reservations/[id]/status.ts` — guardar cancellation_reason
- `src/utils/reservationStatus.ts` — labels actualizados
- `database/migrations/005_add_cancellation_reason.sql` — nueva columna
- APIs existentes reutilizadas: no se crean nuevos endpoints
