## MODIFIED Requirements

### Requirement: Afternoon time slot hours
The system SHALL define the afternoon time slot as 16:00-20:00, both in the centralized pricing utility and in every user-facing or document-generating surface that displays or uses the afternoon slot's start/end time.

#### Scenario: Visitor views afternoon slot hours anywhere in the app
- **WHEN** a visitor or admin views the afternoon time slot label (pricing table, availability page, booking wizard, admin panel, contract, WhatsApp message, PDF, or checkout)
- **THEN** the displayed hours SHALL read "16:00-20:00" (or equivalent "16:00 - 20:00h" formatting)

#### Scenario: A reservation is created for the afternoon slot
- **WHEN** a customer completes a booking for the afternoon slot
- **THEN** the reservation's start time sent to downstream systems (n8n, Google Calendar) SHALL be 16:00

#### Scenario: An admin blocks a date for the afternoon slot
- **WHEN** an admin blocks the afternoon slot for a given date
- **THEN** the blocked time range SHALL be 16:00-20:00

#### Scenario: Afternoon slot no longer has early access
- **WHEN** a visitor views the afternoon slot description
- **THEN** it SHALL NOT mention an early-access time before 16:00 (unlike the night slot, which keeps its early-access mention)

#### Scenario: Morning and night slots remain unaffected
- **WHEN** the afternoon slot hours change
- **THEN** the morning (10:00-14:00) and night (22:00-02:00) slots, and all prices, SHALL remain unchanged
