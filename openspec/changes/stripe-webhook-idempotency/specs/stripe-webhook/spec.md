## ADDED Requirements

### Requirement: Repeated Stripe events are processed once
The Stripe webhook SHALL register a deposit or remaining payment once per Checkout session, even if the event is delivered several times.

#### Scenario: Event delivered twice
- **WHEN** the same `checkout.session.completed` deposit event for reservation 39 arrives twice
- **THEN** the reservation SHALL be confirmed once, and the customer SHALL receive one confirmation email and one WhatsApp
