## MODIFIED Requirements

### Requirement: Process reservation request without n8n
`POST /api/webhook-reserva` SHALL validate the request, atomically check availability and store the reservation in Neon, then notify customer and admin, without calling n8n.

#### Scenario: Slot available
- **WHEN** a valid request arrives for a free date and slot
- **THEN** a `pending` reservation SHALL be stored, a confirmation email sent to the customer, an email and WhatsApp sent to the admin, and the response SHALL be `{ success: true, reservationId: "RES-YYYYMMDD-NNN" }`

#### Scenario: Slot taken
- **WHEN** an active (`pending`, `approved`, `confirmed`) reservation exists for that date and slot
- **THEN** the response SHALL be 409 and nothing SHALL be stored

#### Scenario: Customer email fails
- **WHEN** the reservation is stored but the customer email cannot be sent
- **THEN** the response SHALL still be success, with `emailWarning`

### Requirement: Cancellation and rejection notify the customer
When an admin cancels or rejects a reservation, the customer SHALL receive an email with the reason, and the Google Calendar event (if any) SHALL be deleted.
