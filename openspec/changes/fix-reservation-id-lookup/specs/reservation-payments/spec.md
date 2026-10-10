## MODIFIED Requirements

### Requirement: Cancelled checkout frees the slot
When a customer cancels the Stripe checkout, the pending reservation identified by its code (`RES-YYYYMMDD-NNN`) SHALL be set to `cancelled`, freeing the calendar slot, and its Google Calendar event SHALL be deleted.

#### Scenario: Customer cancels payment
- **WHEN** Stripe redirects to `/booking/cancel?reservation_id=RES-20261020-005`
- **THEN** reservation 5 SHALL become `cancelled` and the slot SHALL be bookable again

### Requirement: Completed payment is recorded
When Stripe confirms a checkout, the reservation identified by the code in the session metadata SHALL be updated (`payment_status`, `deposit_paid`).

#### Scenario: Unknown code
- **WHEN** the metadata code cannot be resolved to a reservation id
- **THEN** a CRITICAL log with the Stripe session and amount SHALL be written
