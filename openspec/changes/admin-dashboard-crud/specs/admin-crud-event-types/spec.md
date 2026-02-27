## ADDED Requirements

### Requirement: List all event types
The system SHALL display all event types from event_types table.

#### Scenario: Admin views event types
- **WHEN** admin navigates to /admin/event-types
- **THEN** system displays event types with: ID, name, description, icon, created_at

### Requirement: Create new event type
The system SHALL allow admin to add new event types with name, description, and icon.

#### Scenario: Create event type
- **WHEN** admin fills form with name="Boda", description="Bodas y ceremonias", icon="💍" and saves
- **THEN** system creates event_type record and updates reservation form dropdown

### Requirement: Edit event type details
The system SHALL allow admin to update event type information inline or in modal.

#### Scenario: Update event type name
- **WHEN** admin edits name field from "cumpleaños" to "Cumpleaños Infantiles" and saves
- **THEN** system updates event_types table and reflects in all reservation forms

### Requirement: Delete event type with validation
The system SHALL prevent deletion of event types currently used in reservations.

#### Scenario: Delete unused event type
- **WHEN** admin deletes event type with no associated reservations
- **THEN** system deletes record successfully

#### Scenario: Prevent deletion of active event type
- **WHEN** admin attempts to delete event type with existing reservations
- **THEN** system shows error "No se puede eliminar. Hay X reservas con este tipo de evento"
