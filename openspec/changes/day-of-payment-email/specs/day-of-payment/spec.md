## ADDED Requirements

### Requirement: Day-of payment options
On the event day the admin SHALL be able to show the payment QR, email the payment link to the reservation's email, or record payment by card terminal (remaining and security deposit).

#### Scenario: Email the link
- **WHEN** the admin clicks "Enviar por email" for a reservation with 140 € pending
- **THEN** the customer SHALL receive an email with the reservation number, the 140 € remaining, the 150 € deposit hold and a pay button, and the modal SHALL show the same link and QR

#### Scenario: Remaining already paid
- **WHEN** the remaining is already paid and the deposit is not held
- **THEN** the email SHALL only ask to hold the 150 € deposit

#### Scenario: No email
- **WHEN** the reservation has no email
- **THEN** the API SHALL respond 400 and the admin SHALL use the QR instead
