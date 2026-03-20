## ADDED Requirements

### Requirement: Calendar event title format
The system SHALL create Google Calendar events with the title "Evento: [tipo de evento]" where [tipo de evento] is the event type from the reservation (e.g., "cumpleanos", "comunion", "bautizo").

#### Scenario: Standard reservation creates titled event
- **WHEN** a reservation is created with eventType "cumpleanos"
- **THEN** the Google Calendar event title SHALL be "Evento: cumpleanos"

#### Scenario: Event title visible in calendar
- **WHEN** viewing the Google Calendar for happyhub.rovellat@gmail.com
- **THEN** each reservation event SHALL display the title instead of "(sin titulo)"
