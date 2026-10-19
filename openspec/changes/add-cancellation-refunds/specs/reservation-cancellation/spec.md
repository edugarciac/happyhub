## ADDED Requirements

### Requirement: Refund eligibility by days before the event
The system SHALL consider a cancellation eligible for a full refund when there are 15 or more calendar days (Europe/Madrid) between today and the event date.

#### Scenario: 15 days before
- **WHEN** today is 2026-11-01 and the event is on 2026-11-16
- **THEN** the cancellation SHALL be eligible for a full refund

#### Scenario: 14 days before
- **WHEN** today is 2026-11-02 and the event is on 2026-11-16
- **THEN** the cancellation SHALL NOT be eligible

### Requirement: Admin chooses whether to refund when cancelling
When the admin cancels a reservation with payments, the cancel dialog SHALL show the paid amounts and a "Devolver lo pagado al cliente" checkbox, checked by default only when the cancellation is eligible.

#### Scenario: Eligible cancellation
- **WHEN** the admin cancels a reservation 20 days before the event with a 60 € card deposit
- **THEN** the checkbox SHALL be checked and confirming SHALL refund 60 € through Stripe

#### Scenario: Late cancellation
- **WHEN** the admin cancels 5 days before the event
- **THEN** the checkbox SHALL be unchecked and no refund SHALL be made unless the admin checks it

### Requirement: Refund everything paid
When a refund is requested, the system SHALL refund through Stripe the remaining refundable amount of every card payment (deposit, remaining payment, paid extra charges), release a Stripe security-deposit hold, and email the admins the amounts paid by other methods that must be returned manually.

#### Scenario: Deposit paid by Bizum
- **WHEN** a refund is requested for a reservation whose deposit was marked as received by Bizum
- **THEN** no Stripe refund SHALL be attempted for it and the admins SHALL receive an email listing the amount to return by Bizum

#### Scenario: Retry after a failed refund
- **WHEN** a Stripe refund fails during cancellation
- **THEN** the reservation SHALL stay cancelled, the admin SHALL see a warning and receive an email, and "Devolver pagos" SHALL refund only what is still pending without refunding twice

### Requirement: Customer is told about the refund
The cancellation email SHALL state the amount refunded to the card and any amount that will be returned by other methods.
