## ADDED Requirements

### Requirement: Admin can open WhatsApp with customer
The system SHALL display a WhatsApp icon/button on each reservation row that opens a `wa.me` deep link with the customer's phone number in international format (no `+`, no spaces, with country prefix `34` for Spanish numbers).

#### Scenario: Admin clicks WhatsApp action
- **WHEN** admin clicks the WhatsApp icon on a reservation row for a customer with phone `624 645 517`
- **THEN** a new tab opens with URL `https://wa.me/34624645517`

#### Scenario: Phone number with country code
- **WHEN** the customer phone is stored as `+34624645517` or `0034624645517`
- **THEN** the wa.me link normalizes it to `https://wa.me/34624645517`

#### Scenario: No phone number available
- **WHEN** a reservation has no associated phone number
- **THEN** the WhatsApp button is disabled or hidden

### Requirement: Admin can open email client for customer
The system SHALL display an email icon/button on each reservation row that opens a `mailto:` link with the customer's email address pre-filled.

#### Scenario: Admin clicks email action
- **WHEN** admin clicks the email icon on a reservation row for a customer with email `juan@example.com`
- **THEN** the system opens the default email client with `mailto:juan@example.com`

#### Scenario: No email available
- **WHEN** a reservation has no associated email address
- **THEN** the email button is disabled or hidden

### Requirement: Contact actions are accessible from the reservation list
Both WhatsApp and email actions SHALL be visible in the actions column of the reservation table, alongside edit and delete actions. They SHALL open in a new browser tab or the system's default application without navigating away from the admin page.

#### Scenario: All action buttons visible
- **WHEN** admin views a reservation row with both phone and email available
- **THEN** the row displays WhatsApp, email, print contract, edit, and delete action buttons

#### Scenario: Actions do not navigate away
- **WHEN** admin clicks a WhatsApp or email action
- **THEN** the admin reservations page remains open and the contact opens in a new tab or external application
