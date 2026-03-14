## Context

Currently, `POST /api/auth/register` creates a user, generates a JWT, and returns it immediately. There is no check that the user actually owns the email address. The users table has no `email_verified` column. Email sending infrastructure exists via n8n workflows (used for reservation confirmations) and the WhatsApp integration, but no direct SMTP setup exists in the Next.js app itself.

The existing auth spec (001-email-password-auth) explicitly listed "No Email Verification" as an assumption. This change reverses that assumption.

## Goals / Non-Goals

**Goals:**
- Prevent fake/mistyped email registrations by requiring email ownership proof
- Send a verification link via email after registration
- Block access to protected features until email is verified
- Allow users to resend the verification link
- Handle existing unverified users gracefully

**Non-Goals:**
- Changing the Google OAuth flow (Google already verifies email ownership)
- Implementing a full transactional email system (use existing n8n or a simple SMTP/SendGrid call)
- Email change verification (separate feature)
- Rate limiting on resend endpoint (can be added later)

## Decisions

### 1. Verification token approach

**Decision**: Generate a cryptographically random token (32 bytes hex), store it in a new `email_verification_tokens` table with `user_id`, `token`, `expires_at` (24 hours), and `used` flag. The verification link is `{BASE_URL}/verify-email?token={token}`.

**Rationale**: Simple, stateless (no session needed to verify), and follows the same pattern as password reset tokens. 24-hour expiry balances security with convenience.

**Alternatives considered**: JWT-based verification tokens (token contains user ID signed) - rejected because we want to invalidate tokens on resend, which requires DB state anyway.

### 2. What happens after registration

**Decision**: Registration still creates the user and returns a JWT, but the JWT payload now includes `emailVerified: false`. The user lands on a "Revisa tu email" page. The JWT allows them to access the resend-verification endpoint and see the verification banner, but protected routes (booking, profile edit) check `emailVerified` and redirect to the verification-pending page.

**Rationale**: Returning a JWT immediately preserves session continuity. The user can resend without re-entering credentials. Restricting protected routes (not all routes) avoids locking the user out of the site entirely.

### 3. Email sending mechanism

**Decision**: Use a simple API call to an email service (SendGrid, AWS SES, or n8n webhook) from the register endpoint. The email contains a branded HTML template with the verification link.

**Rationale**: The app already integrates with n8n for webhooks. A direct n8n webhook call with the verification URL and user name is the simplest path. If n8n is not available, a direct SendGrid/SES API call is the fallback.

### 4. Handling existing users

**Decision**: Add `email_verified BOOLEAN DEFAULT false` to the users table. Run a migration that sets `email_verified = true` for all existing users (grandfathering them in). New registrations start with `email_verified = false`.

**Rationale**: Forcing existing users to re-verify would disrupt active customers. Grandfathering is the safest path. If stricter verification is needed later, a separate campaign can prompt re-verification.

### 5. Google OAuth users skip verification

**Decision**: Users who register via Google OAuth are automatically set to `email_verified = true` since Google has already verified their email ownership.

**Rationale**: Double-verifying Google emails adds friction with zero security benefit.

## Risks / Trade-offs

- **Email delivery failures**: If verification emails don't arrive (spam, misconfiguration), users are stuck. Mitigation: resend button, clear instructions to check spam, support contact.
- **24-hour token expiry**: Users who wait too long lose their token. Mitigation: resend functionality generates a fresh token.
- **Breaking change for existing flow**: Registration no longer grants immediate full access. Mitigation: clear UX (verification-pending page, banner) so users understand the next step.
- **n8n dependency for email**: If n8n is down, verification emails fail. Mitigation: implement a fallback direct SMTP call, or queue and retry.
