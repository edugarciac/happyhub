## ADDED Requirements

### Requirement: List all reservations
The system SHALL display all reservations with status indicators and sorting.

#### Scenario: Admin views reservation list
- **WHEN** admin navigates to /admin/reservations
- **THEN** system displays reservations with: ID, user_id, event_date, time_slot, status, total_price, created_at

#### Scenario: Filter by status
- **WHEN** admin selects status filter (pending, confirmed, cancelled)
- **THEN** system displays only reservations with matching status

#### Scenario: Sort by date
- **WHEN** admin clicks event_date column header
- **THEN** system toggles sorting between ascending and descending order

### Requirement: Create new reservation manually
The system SHALL allow admin to create reservations for walk-in or phone customers.

#### Scenario: Admin creates reservation
- **WHEN** admin fills form with user_id, event_date, time_slot, guests, and saves
- **THEN** system creates reservation with status='pending' and shows success

### Requirement: Update reservation status
The system SHALL allow admin to change reservation status with dropdown.

#### Scenario: Change status to confirmed
- **WHEN** admin changes status from 'pending' to 'confirmed'
- **THEN** system updates reservation and triggers calendar event creation if needed

### Requirement: Delete reservation with confirmation
The system SHALL require confirmation before deleting reservations.

#### Scenario: Delete confirmed reservation
- **WHEN** admin deletes reservation with status='confirmed'
- **THEN** system shows warning "Eliminar reserva confirmada. Google Calendar event también será eliminado. ¿Continuar?"
