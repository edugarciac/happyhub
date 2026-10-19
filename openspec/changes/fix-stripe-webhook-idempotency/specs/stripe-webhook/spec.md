## MODIFIED Requirements

### Requirement: Repeated Stripe events are ignored only after the payment is recorded
The webhook SHALL treat a `checkout.session.completed` event as repeated only when the reservation already stores that session id AND its payment status shows that payment as paid.

#### Scenario: First event for a deposit link created by the payment page
- **WHEN** the deposit session id was stored at link creation and the reservation is not yet `deposit_paid`
- **THEN** the webhook SHALL register the deposit and send the confirmation email

#### Scenario: Stripe retries an already registered payment
- **WHEN** the session id matches and the reservation is already `deposit_paid` (or `fully_paid` for the remaining payment)
- **THEN** the webhook SHALL ignore the event without repeating emails or WhatsApp messages
