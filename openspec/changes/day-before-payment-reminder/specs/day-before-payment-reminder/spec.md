## REMOVED Requirements

### Requirement: Remaining payment reminder three days before the event
**Reason**: Se sustituye por un aviso el día antes que incluye el resto y la fianza.
**Migration**: Los enlaces `remaining_advance` ya enviados siguen siendo válidos hasta que caducan.

## ADDED Requirements

### Requirement: Payment reminder the day before the event
The system SHALL email the customer of each confirmed reservation with a pending remaining amount or an unheld security deposit, the day before the event, a reminder that the remaining amount and the 150 € security deposit hold must be completed before the event starts, with a Stripe link covering both.

#### Scenario: Reminder sent
- **WHEN** a confirmed reservation with total 200 € and 60 € paid has its event tomorrow
- **THEN** the customer SHALL receive one email with the reservation number, the 140 € due, the 150 € deposit hold and a pay link valid until the end of the event day

#### Scenario: Only deposit pending
- **WHEN** the remaining is paid but the deposit is not held
- **THEN** the email SHALL ask only for the deposit hold

#### Scenario: Nothing pending
- **WHEN** the remaining is paid and the deposit is held
- **THEN** no reminder SHALL be sent

#### Scenario: Only once
- **WHEN** the cron runs again for the same reservation
- **THEN** no second reminder SHALL be sent

### Requirement: No card terminal
Customer-facing texts and admin payment options SHALL NOT offer the card terminal for the remaining amount or the security deposit.

#### Scenario: Terms
- **WHEN** a customer reads the terms or the confirmation email
- **THEN** the remaining and the deposit SHALL be described as paid by card through the payment link
