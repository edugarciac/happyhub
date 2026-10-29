## Why

Al editar un partner en `/admin/partners`, el modal se cierra de golpe a mitad de edición y se pierden los cambios. Causa: el fondo oscuro (backdrop) cierra el modal con `onClick`. Si el usuario selecciona texto de un input arrastrando el ratón y suelta fuera del recuadro blanco, el navegador dispara `click` sobre el ancestro común (el backdrop) y el modal se cierra sin aviso. El mismo patrón existe en los modales de reservas y reseñas.

## What Changes

- Nuevo hook `useBackdropClose` que solo cierra el modal si el `mousedown` **y** el `click` ocurren directamente sobre el backdrop.
- Aplicarlo a todos los modales admin con backdrop: partners (editar, borrar), reservations (4 modales), reviews (2 modales).

## Capabilities

### New Capabilities

- `admin-modal-dismissal`: Reglas de cierre de modales en el panel admin

## Impact

- **Frontend**: `src/hooks/useBackdropClose.ts` (nuevo), `src/pages/admin/partners.tsx`, `src/pages/admin/reservations/index.tsx`, `src/pages/admin/reviews.tsx`
- Sin cambios de backend, DB ni APIs

## Addendum: campos numéricos que no se pueden vaciar

Al editar importes (precio total, señal) o invitados, borrar el contenido del input dejaba un `0` inmediatamente (`parseFloat(v) || 0`), obligando a escribir delante del 0. Afecta a: modal de edición de reservas (invitados, precio total, señal), orden en `/admin/services` e invitados en el paso 2 de la reserva pública (que además forzaba un mínimo de 1 al borrar).

- El estado del campo acepta `''` mientras se escribe; la validación/conversión se hace al guardar (reservas: error si precio o señal quedan vacíos) o al salir del campo (paso 2: vuelve al último valor válido).
- Impacto adicional: `src/pages/admin/services.tsx`, `src/components/booking/Step2Configuration.tsx`.
