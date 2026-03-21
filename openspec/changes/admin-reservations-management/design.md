## Context

Las APIs backend para CRUD y gestión de estados ya existen y están funcionales:
- `GET/POST /api/admin/reservations` — listar y crear
- `GET/PATCH/DELETE /api/admin/reservations/[id]` — operaciones individuales
- `PATCH /api/admin/reservations/[id]/status` — transiciones con validación
- `POST /api/admin/reservations/[id]/approve` y `/reject` — con tracking de admin

Las transiciones válidas en `reservationStatus.ts`:
- pending → [approved, rejected, cancelled]
- approved → [cancelled, completed]
- rejected → [pending]
- cancelled → [pending]

Falta: UI de gestión, campo `cancellation_reason`, formularios CRUD.

## Goals / Non-Goals

**Goals:**
- UI completa para gestionar el ciclo de vida de reservas desde admin
- Registrar motivo obligatorio al cancelar
- Crear/editar/borrar reservas sin tocar backend (reutilizar APIs)

**Non-Goals:**
- No se modifican las transiciones de estado existentes
- No se implementa soft delete (el hard delete ya existe)
- No se añade notificación automática al cliente (futuro)
- No se cambia el flujo de reservas del cliente (booking wizard)

## Decisions

### Reutilizar APIs existentes sin crear nuevos endpoints

**Decisión**: Toda la funcionalidad se implementa en frontend, llamando a las APIs que ya existen.

**Rationale**: Las APIs ya soportan CRUD completo y transiciones de estado con validación. Crear endpoints duplicados añadiría complejidad sin beneficio.

### Campo cancellation_reason separado de rejection_reason

**Decisión**: Añadir columna `cancellation_reason` en la tabla `reservations`, independiente de `rejection_reason`.

**Alternativa**: Reutilizar `rejection_reason` para ambos.

**Rationale**: Rechazar y cancelar son acciones distintas con significados diferentes. Rechazar es "no aceptamos esta reserva" (antes del evento). Cancelar puede ocurrir después de aprobar. Mantenerlos separados permite reporting más claro.

### Modales inline en vez de páginas separadas para estados

**Decisión**: Los cambios de estado se hacen con modales de confirmación dentro del listado de reservas.

**Rationale**: Es más rápido para el admin — no necesita navegar a otra página para aprobar/cancelar. El modal de cancelación incluye textarea obligatorio para el motivo.

### Formularios de crear/editar en páginas separadas

**Decisión**: Crear y editar reservas tienen sus propias páginas (`create.tsx`, `[id]/edit.tsx`).

**Rationale**: Los formularios tienen muchos campos (fecha, hora, tipo, invitados, extras, precios). Un modal sería demasiado pequeño. Páginas separadas dentro del AdminLayout mantienen la consistencia.

## Risks / Trade-offs

- [Hard delete sin audit trail] → El borrado es definitivo. Mitigación: modal de confirmación con doble check. Futuro: soft delete.
- [Cancelación sin notificar al cliente] → El admin cancela pero el cliente no recibe email. Mitigación: documentar como mejora futura, el admin puede contactar manualmente.
