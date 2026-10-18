## ADDED Requirements

### Requirement: Remaining payment reminder three days before the event
The system SHALL email the customer of each confirmed reservation with an unpaid remaining amount, three days before the event, a reminder to pay the remaining amount before the event, with a card payment link for the remaining amount only.

#### Scenario: Reminder sent
- **WHEN** a confirmed reservation with total 200 € and 60 € paid has its event in 3 days
- **THEN** the customer SHALL receive one email with the reservation number, the 140 € due and a pay link valid until the end of the event day

#### Scenario: Already paid
- **WHEN** the reservation is fully paid
- **THEN** no reminder SHALL be sent

#### Scenario: Only once
- **WHEN** the cron runs again for the same reservation
- **THEN** no second reminder SHALL be sent

### Requirement: Advance link pays only the remaining amount
The reminder link SHALL let the customer pay the remaining amount only; the security deposit SHALL still be held on the event day.

#### Scenario: Paid in advance
- **WHEN** the customer pays from the reminder link
- **THEN** the reservation SHALL be fully paid, the page SHALL confirm it and say the deposit hold happens on the event day, and the security deposit step SHALL NOT be offered by that link
