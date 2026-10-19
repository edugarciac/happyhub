## MODIFIED Requirements

### Requirement: Payments are matched to reservations by metadata
The Stripe webhook SHALL identify the reservation of a completed checkout session from its metadata (`reservationId`, or `reservation_id` as fallback) and SHALL NOT rely on the session id for matching.

#### Scenario: Payment with a valid reservation code
- **WHEN** a checkout session completes with `metadata.reservationId` of an existing reservation
- **THEN** the reservation SHALL be updated as today

### Requirement: Admin is alerted of unmatched payments
The webhook SHALL email the admins when a completed payment cannot be associated with a reservation or cannot be recorded.

#### Scenario: Reservation not found
- **WHEN** a completed session has no reservation id, an unrecognised code, or a code of a reservation that does not exist
- **THEN** an alert email with amount, reason, customer and Stripe session id SHALL be sent to the admins
- **AND** no "new reservation" WhatsApp notifications SHALL be sent

#### Scenario: Database error while recording the payment
- **WHEN** recording a deposit, remaining payment, security deposit or extra charge fails
- **THEN** an alert email SHALL be sent to the admins
