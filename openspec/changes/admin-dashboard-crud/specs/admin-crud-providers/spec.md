## ADDED Requirements

### Requirement: List all providers
The system SHALL display all service providers with active/inactive status.

#### Scenario: Admin views provider list
- **WHEN** admin navigates to /admin/providers
- **THEN** system displays providers with: ID, name, service_type, email, phone, active status

#### Scenario: Filter by service type
- **WHEN** admin filters by service_type (catering, animación, decoración, fotografía)
- **THEN** system displays only providers matching that service type

### Requirement: Create new provider
The system SHALL allow admin to add new providers with complete profile information.

#### Scenario: Create provider
- **WHEN** admin fills form with name, service_type, email, phone, description, price_range and saves
- **THEN** system creates provider record and adds to provider directory

### Requirement: Edit provider details
The system SHALL allow admin to update provider information.

#### Scenario: Update provider contact info
- **WHEN** admin updates provider phone or email and saves
- **THEN** system updates providers table and reflects in service selection

### Requirement: Activate and deactivate providers
The system SHALL allow admin to toggle provider active status without deletion.

#### Scenario: Deactivate provider
- **WHEN** admin sets provider active=false
- **THEN** provider no longer appears in customer-facing service selection but remains in database

### Requirement: Delete provider with validation
The system SHALL check for associated services before allowing provider deletion.

#### Scenario: Delete provider with no services
- **WHEN** admin deletes provider with no associated services
- **THEN** system deletes provider record successfully

#### Scenario: Prevent deletion of provider with active services
- **WHEN** admin attempts to delete provider with linked services
- **THEN** system shows error "No se puede eliminar. Hay X servicios asociados a este proveedor"
