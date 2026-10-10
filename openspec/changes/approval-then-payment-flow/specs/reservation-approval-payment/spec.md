## ADDED Requirements

### Requirement: Booking request awaits approval
Submitting a booking SHALL create a `pending` reservation storing the chosen payment method (`card` or `bizum`), without redirecting to payment. Cash SHALL NOT be offered.

#### Scenario: Customer submits with card
- **WHEN** a customer submits a booking choosing card
- **THEN** no Stripe checkout SHALL open, and the confirmation screen and email SHALL say the request is pending approval and that a payment link will be emailed after approval, with 24 hours to pay

#### Scenario: Customer submits with Bizum
- **WHEN** a customer submits choosing Bizum
- **THEN** the confirmation SHALL say that after approval they will receive Bizum instructions, with 24 hours to pay

### Requirement: Approval sends payment instructions
When an admin approves a reservation, the system SHALL set `payment_due_at` to 24 hours later, create a deposit payment link expiring at that time, and email the customer: a card payment link, or Bizum instructions (amount, 624 645 517, reservation code as concept) plus the card link.

### Requirement: Deposit payment is recorded
A card payment through the link SHALL mark the reservation `deposit_paid` and the link as used. An admin SHALL be able to mark a Bizum deposit as received.

### Requirement: Unpaid approved reservations expire
An `approved` reservation without deposit paid whose `payment_due_at` has passed SHALL be cancelled with reason "Plazo de pago vencido", freeing the slot, deleting its calendar event and emailing the customer once.

#### Scenario: Slot viewed after expiry
- **WHEN** someone loads availability after the deadline
- **THEN** the expired reservation SHALL be cancelled first and the slot SHALL show as available
