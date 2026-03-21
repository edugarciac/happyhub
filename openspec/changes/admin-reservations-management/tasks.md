## 1. Base de datos

- [ ] 1.1 Crear migración `005_add_cancellation_reason.sql` con columna `cancellation_reason TEXT` en tabla `reservations`
- [ ] 1.2 Ejecutar migración en Neon

## 2. Backend — guardar motivo de cancelación

- [ ] 2.1 Modificar `src/pages/api/admin/reservations/[id]/status.ts` para aceptar y guardar `cancellationReason` cuando el nuevo estado sea `cancelled`
- [ ] 2.2 Actualizar labels en `src/utils/reservationStatus.ts` — renombrar `completed` a "Evento Realizado"

## 3. UI — Gestión de estados en listado

- [ ] 3.1 Añadir botones de acción contextuales por fila en `src/pages/admin/reservations/index.tsx` según transiciones válidas
- [ ] 3.2 Crear componente modal reutilizable `StatusChangeModal` con soporte para confirmación simple y textarea
- [ ] 3.3 Implementar modal de aprobación (confirmación simple → POST approve)
- [ ] 3.4 Implementar modal de cancelación (textarea obligatorio → PATCH status con cancellationReason)
- [ ] 3.5 Implementar modal de "Volver a Pendiente" (confirmación simple → PATCH status)
- [ ] 3.6 Implementar modal de "Evento Realizado" (confirmación simple → PATCH status)
- [ ] 3.7 Refrescar listado tras cada acción sin recargar página

## 4. UI — Crear reserva

- [ ] 4.1 Crear página `src/pages/admin/reservations/create.tsx` con formulario completo (nombre, email, teléfono, fecha, franja, tipo evento, invitados, extras, precios, notas)
- [ ] 4.2 Validación de campos obligatorios con zod
- [ ] 4.3 Envío a `POST /api/admin/reservations` y redirect al listado

## 5. UI — Editar reserva

- [ ] 5.1 Crear página `src/pages/admin/reservations/[id]/edit.tsx` con formulario pre-rellenado
- [ ] 5.2 Cargar datos existentes con `GET /api/admin/reservations/[id]`
- [ ] 5.3 Guardar cambios con `PATCH /api/admin/reservations/[id]` y redirect al listado

## 6. UI — Eliminar reserva

- [ ] 6.1 Añadir botón "Eliminar" por fila con modal de confirmación (advertencia irreversible)
- [ ] 6.2 Llamar a `DELETE /api/admin/reservations/[id]` y eliminar fila del listado

## 7. Navegación

- [ ] 7.1 Añadir botón "Nueva Reserva" en la cabecera del listado enlazando a `/admin/reservations/create`
- [ ] 7.2 Añadir botón "Editar" por fila enlazando a `/admin/reservations/[id]/edit`
