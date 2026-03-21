## ADDED Requirements

### Requirement: Create reservation from admin panel
El sistema SHALL proporcionar un formulario para que el admin cree reservas manualmente.

#### Scenario: Admin creates new reservation
- **WHEN** el admin hace clic en "Nueva Reserva" en el listado
- **THEN** el sistema MUST navegar a `/admin/reservations/create`
- **THEN** el formulario MUST incluir: nombre, email, teléfono, fecha, franja horaria, tipo de evento, número de invitados, extras, precio base, precio total, depósito, notas admin
- **WHEN** el admin envía el formulario con datos válidos
- **THEN** el sistema MUST llamar a `POST /api/admin/reservations`
- **THEN** el sistema MUST redirigir al listado con mensaje de éxito

#### Scenario: Admin submits invalid data
- **WHEN** el admin envía el formulario con campos obligatorios vacíos
- **THEN** el sistema MUST mostrar errores de validación inline

### Requirement: Edit reservation from admin panel
El sistema SHALL proporcionar un formulario para editar reservas existentes.

#### Scenario: Admin edits reservation
- **WHEN** el admin hace clic en "Editar" en una reserva
- **THEN** el sistema MUST navegar a `/admin/reservations/[id]/edit`
- **THEN** el formulario MUST cargar los datos actuales de la reserva
- **WHEN** el admin guarda los cambios
- **THEN** el sistema MUST llamar a `PATCH /api/admin/reservations/[id]`
- **THEN** el sistema MUST redirigir al listado con mensaje de éxito

### Requirement: Delete reservation with confirmation
El sistema SHALL permitir eliminar reservas con doble confirmación.

#### Scenario: Admin deletes reservation
- **WHEN** el admin hace clic en "Eliminar" en una reserva
- **THEN** el sistema MUST mostrar modal de confirmación con advertencia de que es irreversible
- **WHEN** el admin confirma
- **THEN** el sistema MUST llamar a `DELETE /api/admin/reservations/[id]`
- **THEN** el sistema MUST eliminar la fila del listado

#### Scenario: Admin cancels deletion
- **WHEN** el admin hace clic en "Eliminar" y luego cancela el modal
- **THEN** el sistema MUST no hacer nada
