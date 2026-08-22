## ADDED Requirements

### Requirement: Admin receives a WhatsApp notification when any reservation is created
The system SHALL send a WhatsApp message to the configured admin number immediately after a reservation is successfully created, regardless of the selected payment method.

#### Scenario: Card reservation created
- **WHEN** a customer submits a booking with `paymentMethod: 'card'` and the reservation is successfully persisted
- **THEN** the admin receives a WhatsApp message worded "Nueva solicitud de reserva" with the reservation number, customer name, date, time slot, guest count, total price, and deposit amount

#### Scenario: Bizum or cash reservation created
- **WHEN** a customer submits a booking with `paymentMethod: 'bizum'` or `'cash'` and the reservation is successfully persisted
- **THEN** the admin receives the same WhatsApp notification — previously this payment method received no admin notification at all

#### Scenario: WhatsApp delivery failure doesn't fail the booking
- **WHEN** the WhatsApp API call fails (e.g. misconfigured credentials, network error)
- **THEN** the reservation request still succeeds and the customer still receives their normal success response; the failure is only logged server-side

### Requirement: Reservation-request and payment-confirmation notifications are distinguishable
The system SHALL use different message wording for the reservation-creation notification versus the existing payment-success notification, so the admin can tell which stage a reservation is at.

#### Scenario: Card reservation reaches payment success shortly after creation
- **WHEN** a card reservation is created and then its payment succeeds via Stripe
- **THEN** the admin receives two distinct WhatsApp messages in sequence: "Nueva solicitud de reserva" at creation, then "Nueva Reserva Confirmada" at payment success — not the same wording twice
