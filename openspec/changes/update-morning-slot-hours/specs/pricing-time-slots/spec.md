## MODIFIED Requirements

### Requirement: Morning time slot hours
The system SHALL define the morning time slot as 10:00-14:00, both in the centralized pricing utility and in every user-facing or document-generating surface that displays or uses the morning slot's start/end time.

#### Scenario: Visitor views morning slot hours anywhere in the app
- **WHEN** a visitor or admin views the morning time slot label (pricing table, availability page, booking wizard, admin panel, contract, WhatsApp message, PDF, or checkout)
- **THEN** the displayed hours SHALL read "10:00-14:00" (or equivalent "10:00 - 14:00h" formatting)

#### Scenario: A reservation is created for the morning slot
- **WHEN** a customer completes a booking for the morning slot
- **THEN** the reservation's start time sent to downstream systems (n8n, Google Calendar) SHALL be 10:00

#### Scenario: An admin blocks a date for the morning slot
- **WHEN** an admin blocks the morning slot for a given date
- **THEN** the blocked time range SHALL be 10:00-14:00

#### Scenario: Afternoon and night slots remain unaffected
- **WHEN** the morning slot hours change
- **THEN** the afternoon (16:30-20:30) and night (22:00-02:00) slots, and all prices, SHALL remain unchanged
