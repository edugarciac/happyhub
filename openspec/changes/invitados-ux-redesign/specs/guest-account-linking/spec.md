## ADDED Requirements

### Requirement: System links orphaned participant rows to a user account by email
The system SHALL match any `collaborative_event_participants` row with `user_id IS NULL` to a user account when an email match is found, granting that user dashboard access to the corresponding event(s).

#### Scenario: Linking on registration
- **WHEN** a new user completes registration with email `ana@example.com`
- **THEN** the system links every existing participant row with `user_id IS NULL AND email = 'ana@example.com'` to the new user's id

#### Scenario: Linking on login
- **WHEN** an existing user logs in and a participant row with a matching, unlinked email exists (e.g. added as a guest by an organizer after the account already existed)
- **THEN** the system links that participant row to the user's id during the login flow

#### Scenario: No matching participant rows
- **WHEN** a user registers or logs in and no participant row matches their email
- **THEN** the system completes registration/login normally with no linking side effect

### Requirement: Anonymous event join requires an email address
The system SHALL require an email address when a person joins a collaborative event without an authenticated session, so the resulting participant row can later be linked to an account.

#### Scenario: Anonymous join with email
- **WHEN** an unauthenticated person submits the join form with a name and a valid email
- **THEN** the system creates a participant row with `user_id = NULL` and the given email

#### Scenario: Anonymous join without email
- **WHEN** an unauthenticated person submits the join form without an email
- **THEN** the system rejects the request with a validation error

### Requirement: Guest table shows linked-account status
The organizer's guest list SHALL indicate whether each guest's participant row is linked to a user account.

#### Scenario: Linked guest
- **WHEN** the organizer views the guest list and a guest's `user_id` is set
- **THEN** the guest row shows a "Cuenta vinculada" indicator

#### Scenario: Unlinked guest
- **WHEN** the organizer views the guest list and a guest's `user_id` is null
- **THEN** the guest row shows a "Solo RSVP" indicator
