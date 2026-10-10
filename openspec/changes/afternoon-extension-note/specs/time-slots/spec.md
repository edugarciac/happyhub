## ADDED Requirements

### Requirement: Afternoon extension note
Wherever time slots or prices are shown to customers, the system SHALL state that the afternoon slot can be extended until 23:00 on request.

#### Scenario: Customer views the booking calendar
- **WHEN** a customer views the booking calendar
- **THEN** a footnote SHALL say the afternoon slot can be extended until 23:00h

#### Scenario: Customer views the price table
- **WHEN** a customer views the homepage price table
- **THEN** the afternoon column SHALL carry an asterisk linked to the same note
