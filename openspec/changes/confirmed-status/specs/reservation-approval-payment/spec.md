## ADDED Requirements

### Requirement: Paid reservations are Confirmed
A reservation SHALL move from `approved` to `confirmed` when its deposit is paid by card (Stripe webhook) or marked as received by Bizum. `confirmed` SHALL NOT be selectable manually, and `completed` SHALL only be reachable from `confirmed`.

#### Scenario: Card deposit paid
- **WHEN** Stripe confirms the deposit for an approved reservation
- **THEN** its status SHALL be `confirmed` and payment status `deposit_paid`

#### Scenario: Payment after expiry
- **WHEN** a deposit payment arrives for a reservation no longer `approved`
- **THEN** the payment SHALL be recorded, the status SHALL NOT change, and the admins SHALL be emailed
