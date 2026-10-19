## ADDED Requirements

### Requirement: Admin is alerted of incomplete deposits
When the webhook records a deposit whose paid amount is lower than the reservation's deposit amount, it SHALL record the payment and email the admins with the paid, expected and missing amounts.

#### Scenario: Deposit paid for less than expected
- **WHEN** a deposit session of 1 € completes for a reservation with a 60 € deposit
- **THEN** the reservation SHALL be marked as deposit paid
- **AND** the admins SHALL receive "Señal incompleta: cobrados 1 € de 60 €"

#### Scenario: Deposit paid in full
- **WHEN** the paid amount equals or exceeds the deposit amount
- **THEN** no incomplete-deposit alert SHALL be sent
