## ADDED Requirements

### Requirement: Action buttons per reservation row
El listado de reservas SHALL mostrar botones de acción contextuales por cada reserva, según las transiciones válidas desde su estado actual.

#### Scenario: Pending reservation shows approve and cancel buttons
- **WHEN** una reserva tiene estado `pending`
- **THEN** el sistema MUST mostrar botones "Aprobar", "Rechazar" y "Cancelar"

#### Scenario: Approved reservation shows cancel and complete buttons
- **WHEN** una reserva tiene estado `approved`
- **THEN** el sistema MUST mostrar botones "Cancelar" y "Evento Realizado"

#### Scenario: Cancelled reservation shows reopen button
- **WHEN** una reserva tiene estado `cancelled`
- **THEN** el sistema MUST mostrar botón "Volver a Pendiente"

#### Scenario: Rejected reservation shows reopen button
- **WHEN** una reserva tiene estado `rejected`
- **THEN** el sistema MUST mostrar botón "Volver a Pendiente"

#### Scenario: Completed reservation shows no action buttons
- **WHEN** una reserva tiene estado `completed`
- **THEN** el sistema MUST no mostrar botones de transición de estado

### Requirement: Approve confirmation modal
El sistema SHALL mostrar un modal de confirmación antes de aprobar una reserva.

#### Scenario: Admin approves reservation
- **WHEN** el admin hace clic en "Aprobar"
- **THEN** el sistema MUST mostrar modal con resumen (fecha, tipo, invitados)
- **WHEN** el admin confirma
- **THEN** el sistema MUST llamar a `POST /api/admin/reservations/[id]/approve`
- **THEN** el sistema MUST actualizar el listado sin recargar la página

### Requirement: Cancel requires reason
El sistema SHALL requerir un motivo obligatorio al cancelar una reserva.

#### Scenario: Admin cancels reservation
- **WHEN** el admin hace clic en "Cancelar"
- **THEN** el sistema MUST mostrar modal con textarea para el motivo
- **THEN** el textarea MUST ser obligatorio (no puede estar vacío)
- **WHEN** el admin confirma con motivo escrito
- **THEN** el sistema MUST llamar a `PATCH /api/admin/reservations/[id]/status` con `{ status: 'cancelled', cancellationReason: '...' }`

#### Scenario: Admin tries to cancel without reason
- **WHEN** el admin intenta confirmar cancelación con textarea vacío
- **THEN** el sistema MUST mostrar error de validación y no enviar la petición

### Requirement: Cancellation reason stored in database
El sistema SHALL almacenar el motivo de cancelación en un campo dedicado `cancellation_reason`.

#### Scenario: Cancellation reason persisted
- **WHEN** se cancela una reserva con motivo
- **THEN** el sistema MUST guardar el motivo en `reservations.cancellation_reason`
- **THEN** el motivo MUST ser visible al consultar los detalles de la reserva

### Requirement: Reopen to pending confirmation
El sistema SHALL permitir reabrir reservas canceladas o rechazadas con confirmación.

#### Scenario: Admin reopens cancelled reservation
- **WHEN** el admin hace clic en "Volver a Pendiente" en una reserva cancelada
- **THEN** el sistema MUST mostrar modal de confirmación
- **WHEN** el admin confirma
- **THEN** el sistema MUST llamar a `PATCH /api/admin/reservations/[id]/status` con `{ status: 'pending' }`

### Requirement: Mark as event completed
El sistema SHALL permitir marcar una reserva aprobada como "Evento Realizado".

#### Scenario: Admin marks event as completed
- **WHEN** el admin hace clic en "Evento Realizado" en una reserva aprobada
- **THEN** el sistema MUST mostrar modal de confirmación
- **WHEN** el admin confirma
- **THEN** el sistema MUST llamar a `PATCH /api/admin/reservations/[id]/status` con `{ status: 'completed' }`
