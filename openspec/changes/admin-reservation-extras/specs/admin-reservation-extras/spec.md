## ADDED Requirements

### Requirement: Admin can add extra hours and services
The manual reservation form and the edit modal SHALL let the admin choose 0–3 extra afternoon hours (60 €/hour, until 23:00h) and any active catalog service, adjusting the total price by the difference.

#### Scenario: Manual reservation with extras
- **WHEN** the admin creates an afternoon reservation with 2 extra hours and one 50 € service on a 200 € total
- **THEN** the total SHALL become 370 €, the deposit 111 €, `extra_hours` SHALL be 2, `extras` SHALL contain the service, and the calendar event SHALL end at 22:00

#### Scenario: Morning slot
- **WHEN** the slot is morning
- **THEN** the extra hours selector SHALL NOT be shown, hours SHALL be 0, and the API SHALL reject extra hours with 400

#### Scenario: Editing extras
- **WHEN** the admin adds 1 hour to an existing afternoon reservation
- **THEN** the total SHALL increase by 60 €, the deposit SHALL NOT change, and the calendar event SHALL end at 21:00

#### Scenario: Unknown service
- **WHEN** the request includes a service id not active in the catalog and not already stored on the reservation
- **THEN** the API SHALL respond 400 and not save

### Requirement: Services are stored with the reservation
The system SHALL store the selected services (id, title, price) in `reservations.extras` for web and admin reservations, and show them in the admin list.
