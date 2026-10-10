## ADDED Requirements

### Requirement: Send transactional email via Resend
The platform SHALL send transactional emails (account verification, password reset, reservation confirmation, admin notification, cancellation/rejection) through Resend using `RESEND_API_KEY`.

#### Scenario: Resend configured
- **WHEN** an email is triggered and `RESEND_API_KEY` is set
- **THEN** it SHALL be sent from `EMAIL_FROM` (default `HappyHub <hola@happyhub.es>`) and the send result SHALL be logged

#### Scenario: Resend fails
- **WHEN** Resend returns an error
- **THEN** the calling operation SHALL NOT fail because of it, and the error SHALL be logged

#### Scenario: User data in templates
- **WHEN** user-provided text (name, message) is rendered in an email
- **THEN** it SHALL be HTML-escaped
