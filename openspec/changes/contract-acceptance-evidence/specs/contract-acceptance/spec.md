## ADDED Requirements

### Requirement: Server-side acceptance is mandatory
The reservation API SHALL reject any booking request without `acceptTerms === true`, a terms version and the terms text shown to the customer.

#### Scenario: Request without acceptance
- **WHEN** a booking request arrives without accepted terms
- **THEN** the API SHALL respond 400 and SHALL NOT create a reservation

### Requirement: Immutable acceptance evidence
For every reservation created from the web, the system SHALL store one `contract_acceptances` row with identity, terms text and SHA-256, terms version, deployed commit, contract snapshot, acceptance method, scrolled-to-end flag, server timestamp, IP, user agent, accept-language and an evidence SHA-256.

#### Scenario: Evidence cannot be altered
- **WHEN** anyone tries to UPDATE (other than first setting `confirmation_email_sent_at`) or DELETE an evidence row
- **THEN** the database SHALL raise an error

#### Scenario: Evidence write fails
- **WHEN** the evidence row cannot be stored
- **THEN** the reservation SHALL be removed and the API SHALL respond 500

### Requirement: Acceptance confirmation email
The customer request email SHALL state the accepted terms version, the acceptance date and time and a link to the terms, and the system SHALL record when it was sent.

### Requirement: Evidence on the contract
The admin contract SHALL show the acceptance evidence when it exists.
