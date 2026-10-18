## ADDED Requirements

### Requirement: Login and booking attempts are audited
The system SHALL persist an audit event for every password login, Google login, registration, web reservation attempt and admin manual reservation, including outcome, reason, email, IP, user agent and request id.

#### Scenario: Failed password login
- **WHEN** a user logs in with a wrong password
- **THEN** an `auth.login` event with outcome `failure` and reason `bad_credentials` SHALL be stored

#### Scenario: Rejected web reservation
- **WHEN** `/api/webhook-reserva` responds with an error
- **THEN** a `reservation.web` event with outcome `failure`, the HTTP status and the response `step`/`error` SHALL be stored

#### Scenario: Audit storage fails
- **WHEN** writing the audit event fails
- **THEN** the original request SHALL complete normally

### Requirement: Admin can create a reservation for a new client
The admin manual reservation SHALL create the client user with an unusable password hash so the insert does not violate `password_hash NOT NULL`.

#### Scenario: New client email
- **WHEN** the admin creates a reservation for an email not in `users`
- **THEN** the user and the reservation SHALL be created
