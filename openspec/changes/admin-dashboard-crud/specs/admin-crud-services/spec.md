## ADDED Requirements

### Requirement: List all services
The system SHALL display all services with provider and reservation associations.

#### Scenario: Admin views services list
- **WHEN** admin navigates to /admin/services
- **THEN** system displays services with: ID, service_name, service_type, provider_id, price, status

#### Scenario: Filter services by status
- **WHEN** admin filters by status (pending, confirmed, completed, cancelled)
- **THEN** system displays only services matching that status

### Requirement: Create new service
The system SHALL allow admin to create service records linked to reservations and providers.

#### Scenario: Create service for reservation
- **WHEN** admin fills form with reservation_id, provider_id, service_name, price and saves
- **THEN** system creates service record linked to specified reservation

### Requirement: Edit service details
The system SHALL allow admin to update service information and pricing.

#### Scenario: Update service price
- **WHEN** admin changes service price and saves
- **THEN** system updates services table and recalculates reservation total if needed

### Requirement: Change service status
The system SHALL allow admin to update service status through workflow.

#### Scenario: Confirm service
- **WHEN** admin changes service status from 'pending' to 'confirmed'
- **THEN** system updates status and notifies provider if email configured

### Requirement: Delete service
The system SHALL allow admin to remove services from reservations.

#### Scenario: Delete service with confirmation
- **WHEN** admin deletes service and confirms
- **THEN** system removes service and recalculates reservation total
