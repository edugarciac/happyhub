## ADDED Requirements

### Requirement: Display complete reservation details
The system SHALL show all reservation information on approval page for admin review.

#### Scenario: Admin views approval page
- **WHEN** admin navigates to /admin/approve-reservation/[id]
- **THEN** system displays: customer info (name, email, phone), event details (date, time_slot, event_type, guests), pricing (base_price, total_price), timestamp (created_at), current status

### Requirement: Approve reservation with confirmation
The system SHALL allow admin to approve reservation with single button click.

#### Scenario: Admin approves reservation
- **WHEN** admin clicks "Aprobar Reserva" button
- **THEN** system shows confirmation "¿Aprobar reserva #[ID]?" and on confirm updates status to 'approved'

### Requirement: Reject reservation with mandatory reason
The system SHALL require rejection reason text input before allowing rejection.

#### Scenario: Admin rejects with reason
- **WHEN** admin clicks "Rechazar", enters reason "Fecha ocupada por otro evento", and confirms
- **THEN** system updates status to 'rejected' and stores rejection_reason

#### Scenario: Reject without reason blocked
- **WHEN** admin clicks "Rechazar" but leaves reason field empty
- **THEN** system shows validation error "El motivo de rechazo es obligatorio"

### Requirement: Prevent duplicate approval actions
The system SHALL disable action buttons after reservation is approved or rejected.

#### Scenario: View already processed reservation
- **WHEN** admin opens approval page for reservation with status='approved' or 'rejected'
- **THEN** action buttons are disabled and status badge shows "Ya procesada"
