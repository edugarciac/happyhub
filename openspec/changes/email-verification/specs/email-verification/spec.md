## ADDED Requirements

### Requirement: System sends verification email after registration
The system SHALL send a verification email to the user's registered email address immediately after account creation. The email SHALL contain a unique verification link with a cryptographically random token valid for 24 hours.

#### Scenario: Successful registration triggers verification email
- **WHEN** a user completes registration with email `juan@example.com`
- **THEN** the system creates the account, sends a verification email to `juan@example.com` containing a link in the format `{BASE_URL}/verify-email?token={random_token}`, and the token is stored in the database with a 24-hour expiry

#### Scenario: Google OAuth registration skips verification
- **WHEN** a user registers via Google OAuth
- **THEN** the system sets `email_verified = true` immediately and does NOT send a verification email

### Requirement: User can verify email by clicking the link
The system SHALL provide a `/verify-email` page that accepts a `token` query parameter, validates it against the database, marks the user's email as verified, and grants full access.

#### Scenario: Valid verification token
- **WHEN** a user opens the verification link with a valid, unexpired, unused token
- **THEN** the system marks the user's `email_verified` as `true`, invalidates the token, and redirects to the dashboard with a success message "Email verificado correctamente"

#### Scenario: Expired verification token
- **WHEN** a user opens a verification link with a token older than 24 hours
- **THEN** the system displays "Este enlace ha caducado. Solicita uno nuevo" with a button to resend the verification email

#### Scenario: Already used verification token
- **WHEN** a user opens a verification link with a token that has already been used
- **THEN** the system displays "Este email ya ha sido verificado" and redirects to the dashboard

#### Scenario: Invalid or missing token
- **WHEN** a user opens `/verify-email` without a token or with a malformed token
- **THEN** the system displays "Enlace de verificacion no valido"

### Requirement: User can resend verification email
The system SHALL allow unverified users to request a new verification email. Previous tokens for that user SHALL be invalidated when a new one is generated.

#### Scenario: Resend verification email
- **WHEN** an authenticated user with `email_verified = false` clicks "Reenviar email de verificacion"
- **THEN** the system invalidates all previous verification tokens for that user, generates a new token, and sends a new verification email

#### Scenario: Verified user cannot resend
- **WHEN** an authenticated user with `email_verified = true` attempts to call the resend endpoint
- **THEN** the system responds with "Tu email ya esta verificado"

### Requirement: Unverified users have restricted access
The system SHALL restrict unverified users from accessing protected features (booking, profile edit, reservations). Unverified users SHALL see a banner prompting them to verify their email.

#### Scenario: Unverified user tries to book
- **WHEN** an authenticated user with `email_verified = false` navigates to `/reservas`
- **THEN** the system redirects them to a verification-pending page with the message "Verifica tu email para continuar" and a resend button

#### Scenario: Unverified user sees verification banner
- **WHEN** an authenticated user with `email_verified = false` accesses any page
- **THEN** a persistent banner appears at the top: "Verifica tu email para acceder a todas las funciones" with a resend link

#### Scenario: Verified user has full access
- **WHEN** an authenticated user with `email_verified = true` navigates to any protected page
- **THEN** the system grants access normally with no banner

### Requirement: Registration flow shows verification-pending screen
After registration, the system SHALL display a "Revisa tu email" screen instead of redirecting directly to the dashboard. The screen SHALL show the email address where the verification was sent and a resend button.

#### Scenario: Post-registration screen
- **WHEN** a user completes email/password registration
- **THEN** the system shows a screen with "Hemos enviado un enlace de verificacion a {email}. Revisa tu bandeja de entrada (y la carpeta de spam)" and a "Reenviar email" button

### Requirement: Database stores email verification state
The system SHALL store an `email_verified` boolean column on the `users` table. The system SHALL store verification tokens in a dedicated `email_verification_tokens` table with columns: `id`, `user_id`, `token`, `expires_at`, `used`, `created_at`.

#### Scenario: New user default state
- **WHEN** a new user is created via email/password registration
- **THEN** the `email_verified` column is set to `false`

#### Scenario: Token storage
- **WHEN** a verification token is generated
- **THEN** it is stored with a 24-hour `expires_at` timestamp and `used = false`

#### Scenario: Token invalidation on resend
- **WHEN** a new verification token is generated for a user
- **THEN** all previous tokens for that user are marked as `used = true`
