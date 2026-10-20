## ADDED Requirements

### Requirement: Resend the deposit payment link
The admin SHALL be able to resend the deposit payment link of an approved reservation without a paid deposit, which SHALL invalidate previous deposit links, reset the payment deadline to 24 hours from now and email the reservation's current customer.

#### Scenario: Customer corrected after approval
- **WHEN** the admin changes the reservation's customer and uses "Reenviar enlace de pago de la señal"
- **THEN** the new customer SHALL receive the approval email with a new payment link valid for 24 hours
- **AND** the previous link SHALL no longer work
- **AND** the admin SHALL see the link with copy and WhatsApp buttons

#### Scenario: Reservation not awaiting the deposit
- **WHEN** the reservation is not approved or its deposit is already paid
- **THEN** the action SHALL not be offered and the API SHALL reject the request
