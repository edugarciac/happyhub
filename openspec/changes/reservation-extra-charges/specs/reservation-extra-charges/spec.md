## ADDED Requirements

### Requirement: Admin creates an extra charge payment link
The admin SHALL be able to create a payment link for a reservation with a concept (schedule extension of 1–3 hours, additional services, full day, other) and an amount, and the system SHALL email it to the reservation's email using the reservation email template.

#### Scenario: Schedule extension
- **WHEN** the admin creates a 2-hour extension charge for reservation RES-20261120-012
- **THEN** the suggested amount SHALL be 120 €, and the customer SHALL receive an email with the reservation number, "Extensión de horario (2 h)", 120 € and a pay button

#### Scenario: Other concept without description
- **WHEN** the concept is "other" and no description is given
- **THEN** the API SHALL respond 400

#### Scenario: Cancelled reservation
- **WHEN** the reservation is cancelled or rejected
- **THEN** the API SHALL respond 400 and not create the charge

### Requirement: Customer pays the charge
The customer SHALL pay the charge by card from the link; the system SHALL mark it as paid and email a confirmation to the customer and the admin, without changing the reservation total.

#### Scenario: Paid
- **WHEN** Stripe confirms the checkout of a pending charge
- **THEN** the charge SHALL be `paid`, the link SHALL show it as paid, and the reservation total SHALL be unchanged

#### Scenario: Cancelled or expired link
- **WHEN** the customer opens a cancelled or expired charge link
- **THEN** the page SHALL show that the link is no longer valid and SHALL NOT allow payment

### Requirement: Admin manages charges
The admin SHALL see each reservation's charges with status, copy the link, mark a pending charge as paid manually, or cancel it.
