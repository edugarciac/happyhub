## ADDED Requirements

### Requirement: Manual reservations notify the client like web reservations
When the admin creates a reservation with a client email, the system SHALL send the client the same reservation request email as a web reservation and SHALL create the pending Google Calendar event.

#### Scenario: Manual reservation with email
- **WHEN** the admin creates a reservation for `cliente@example.com`
- **THEN** `cliente@example.com` SHALL receive the "Solicitud de reserva RES-YYYYMMDD-NNN" email
- **AND** a `[PENDIENTE]` Calendar event SHALL be created and its id stored

#### Scenario: Email fails
- **WHEN** the email cannot be sent
- **THEN** the reservation SHALL still be created and the admin SHALL see a warning

### Requirement: Admin can resend the reservation email
The admin SHALL be able to resend the reservation request email of a pending reservation.

#### Scenario: Resend for pending reservation
- **WHEN** the admin resends the email of a pending reservation with client email
- **THEN** the client SHALL receive the request email again and no duplicate Calendar event SHALL be created

#### Scenario: Not pending
- **WHEN** the reservation is not `pending`
- **THEN** the endpoint SHALL respond 409 without sending
