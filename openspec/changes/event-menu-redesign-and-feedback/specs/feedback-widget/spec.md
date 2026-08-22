## ADDED Requirements

### Requirement: Public feedback capture
Any visitor SHALL be able to submit a text feedback message from any non-admin page via a discreet floating button, without logging in.

#### Scenario: Visitor submits feedback
- **WHEN** a visitor writes a message and submits the feedback form
- **THEN** it SHALL be stored in the database and SHALL trigger a WhatsApp message to the admin number

### Requirement: Admin feedback view
Admins SHALL be able to see all submitted feedback in a simple list at `/admin/feedback`.

#### Scenario: Admin reviews feedback
- **WHEN** an authenticated admin opens `/admin/feedback`
- **THEN** they SHALL see all feedback messages ordered by most recent first
