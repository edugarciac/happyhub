## ADDED Requirements

### Requirement: List all client users
The system SHALL display users with role='client' in paginated data table.

#### Scenario: Admin views client list
- **WHEN** admin navigates to /admin/clients
- **THEN** system displays users where role='client' with columns: ID, name, email, phone, created_at

#### Scenario: Search clients by name or email
- **WHEN** admin types in search box
- **THEN** system filters clients by name or email matching search term

### Requirement: View client details and reservations
The system SHALL display full client profile with reservation history.

#### Scenario: View client profile
- **WHEN** admin clicks on client row
- **THEN** system displays modal with client details and list of their reservations

### Requirement: Edit client information
The system SHALL allow admin to update client name, phone, and email.

#### Scenario: Update client details
- **WHEN** admin edits client fields and saves
- **THEN** system updates users table and shows success message

### Requirement: Delete client with cascade warning
The system SHALL warn admin about cascade effects before deleting client.

#### Scenario: Delete client with reservations
- **WHEN** admin attempts to delete client with existing reservations
- **THEN** system shows warning "Este cliente tiene X reservas. ¿Continuar?" before deletion
