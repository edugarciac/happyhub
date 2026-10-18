## MODIFIED Requirements

### Requirement: Unpaid deposit reminder and cancellation
An approved reservation whose deposit is unpaid 24 hours after approval SHALL NOT be cancelled; the system SHALL email the customer a reminder with the payment link stating that the reservation will be cancelled if the deposit is not paid within 24 more hours. The reservation SHALL be cancelled only after that second deadline.

#### Scenario: Reminder at 24 hours
- **WHEN** a reservation was approved 24 hours ago and the deposit is unpaid
- **THEN** the customer SHALL receive one reminder email with a payment link and the new deadline, and the reservation SHALL stay approved

#### Scenario: Cancellation at 48 hours
- **WHEN** 24 hours have passed since the reminder and the deposit is still unpaid
- **THEN** the reservation SHALL be cancelled, the slot freed and the cancellation email sent

#### Scenario: Payment after the reminder
- **WHEN** the customer pays after the reminder and before the new deadline
- **THEN** the reservation SHALL NOT be cancelled

#### Scenario: Never cancelled without reminder
- **WHEN** the payment deadline has passed but no reminder has been sent
- **THEN** the reservation SHALL NOT be cancelled
