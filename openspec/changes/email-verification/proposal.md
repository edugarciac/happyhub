## Why

Anyone can register with a fake or mistyped email address. This means HappyHub cannot reliably contact customers about their reservations, send confirmations, or process password resets. By requiring email verification before the account becomes fully active, we ensure every registered user owns the email they provided.

## What Changes

- After registration, the system sends a verification email containing a unique, time-limited link
- Until the user clicks the link, the account is marked as `email_unverified` and access to protected features (booking, profile) is restricted
- A "Verifica tu email" banner is shown to unverified users with a resend option
- The registration API no longer returns a fully active session immediately; instead the user lands on a "check your email" confirmation screen
- **BREAKING**: Existing unverified users (those who registered before this change) will need to verify their email on next login

## Capabilities

### New Capabilities
- `email-verification`: Email ownership verification flow during registration, including token generation, verification endpoint, resend functionality, and unverified-state handling

### Modified Capabilities
<!-- No existing openspec/specs/ to modify -->

## Impact

- **Database**: New `email_verified` boolean column on `users` table (default `false`); new `email_verification_tokens` table (token, user_id, expires_at, used)
- **API routes**: New `POST /api/auth/verify-email` (validates token), new `POST /api/auth/resend-verification` (sends new link); modified `POST /api/auth/register` (sends verification email after creating user)
- **Email service**: Requires sending HTML verification emails with a branded template (via n8n workflow or direct SMTP)
- **Frontend pages**: New `/verify-email` page; modified registration flow to show "check your email" screen; verification banner component for unverified users
- **Auth middleware**: Protected routes must check `email_verified` flag in addition to valid JWT
