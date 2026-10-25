## ADDED Requirements

### Requirement: Terms list only the enabled payment methods
The terms SHALL only mention Bizum as a deposit payment method when `BIZUM_ENABLED` is true.

#### Scenario: Bizum disabled
- **WHEN** a customer reads the terms with `BIZUM_ENABLED = false`
- **THEN** the terms SHALL say the deposit is paid by card and SHALL NOT mention Bizum

#### Scenario: Bizum re-enabled
- **WHEN** `BIZUM_ENABLED` is set to true
- **THEN** the terms SHALL again offer card or Bizum for the deposit

### Requirement: Contract shows how the reservation pays the deposit
The admin contract SHALL state the deposit method of that reservation.

#### Scenario: Old reservation paid by Bizum
- **WHEN** the admin opens the contract of a reservation with `payment_method = 'bizum'`
- **THEN** the contract SHALL say the deposit is paid by Bizum
