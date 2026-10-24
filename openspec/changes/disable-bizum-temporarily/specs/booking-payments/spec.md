## ADDED Requirements

### Requirement: Bizum can be switched off
The system SHALL offer Bizum for the deposit only when `BIZUM_ENABLED` is true.

#### Scenario: Customer books while Bizum is off
- **WHEN** a customer reaches the customer-data step
- **THEN** only "Tarjeta" SHALL be offered and preselected

#### Scenario: API receives Bizum while off
- **WHEN** a booking request arrives with `paymentMethod: 'bizum'`
- **THEN** the API SHALL respond 400 asking to pay by card

#### Scenario: Earlier Bizum reservation pays deposit
- **WHEN** a reservation stored with Bizum opens its pay page or gets a deposit email
- **THEN** only card payment instructions SHALL be shown
