## ADDED Requirements

### Requirement: Admin WhatsApp notification is delivered before responding
`POST /api/webhook-reserva` SHALL wait (up to 5 seconds) for the admin WhatsApp notification attempt before returning, and SHALL log when it is not sent.

#### Scenario: WhatsApp configured
- **WHEN** a reservation request succeeds and WhatsApp env vars are set
- **THEN** the admin WhatsApp message SHALL be sent before the HTTP response is returned

#### Scenario: WhatsApp fails or is slow
- **WHEN** the WhatsApp API errors or takes longer than 5 seconds
- **THEN** the reservation SHALL still succeed and the failure SHALL be logged
