## ADDED Requirements

### Requirement: Holiday bookings require explicit case-by-case confirmation
The system SHALL NOT auto-charge a customer for a booking on a holiday date. Instead of redirecting to instant card payment, the booking SHALL be submitted as a pending request and require HappyHub to explicitly confirm it before any payment link is issued.

#### Scenario: Customer books a holiday date with card payment
- **WHEN** a customer completes the booking wizard for a date present in `holidays` (and not blocked) with `paymentMethod = 'card'`
- **THEN** the system SHALL NOT redirect to Stripe checkout
- **AND** the reservation SHALL be created with status `pending`, same as the existing bizum/cash flow
- **AND** the customer SHALL see a confirmation screen explaining the date is a holiday and requires HappyHub's explicit confirmation before payment

#### Scenario: Customer books a non-holiday date with card payment
- **WHEN** a customer completes the booking wizard for a date not present in `holidays`, with `paymentMethod = 'card'`
- **THEN** the system SHALL behave exactly as before this change — immediate redirect to Stripe checkout for the deposit

#### Scenario: Admin is alerted that a request needs case-by-case review
- **WHEN** a new reservation request is submitted for a holiday date
- **THEN** the admin WhatsApp notification for that request SHALL be prefixed with a visible "FESTIVO — requiere confirmación caso a caso" marker, distinguishing it from ordinary requests

#### Scenario: Admin confirms a holiday reservation
- **WHEN** an admin reviews a pending holiday reservation and approves it via the existing `/admin/approve-reservation/[id]` flow
- **THEN** the reservation SHALL proceed exactly as any other approved reservation (status `approved`, customer notified) — no new admin mechanism is introduced by this requirement
