## ADDED Requirements

### Requirement: Manual reservation price from current rates
The manual reservation form SHALL compute the total and 30% deposit from the current pricing rules for the selected date and slot, plus extra hours and services, using the same server calculation as the booking wizard.

#### Scenario: Weekend afternoon with extras
- **WHEN** the admin picks a Saturday afternoon (200 €), 2 extra hours and a 50 € service
- **THEN** the total SHALL be 370 € and the deposit 111 €, with the breakdown shown

#### Scenario: Price on request
- **WHEN** the rate for the date and slot is "A consultar"
- **THEN** the form SHALL show a warning and leave the price fields for manual input
