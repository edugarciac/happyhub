## ADDED Requirements

### Requirement: Denied card payments are recorded
The system SHALL record the reason of a declined Stripe payment on its reservation and show it in the admin reservations list until the reservation is paid.

#### Scenario: Card declined
- **WHEN** Stripe sends `payment_intent.payment_failed` for a reservation payment
- **THEN** the reservation SHALL store the Spanish decline reason and timestamp, and its status SHALL NOT change

#### Scenario: Retry succeeds
- **WHEN** a later payment for the same reservation completes
- **THEN** the stored payment error SHALL be cleared

#### Scenario: Unknown reservation
- **WHEN** the failed PaymentIntent cannot be linked to a reservation
- **THEN** the error SHALL be logged and nothing SHALL be updated
