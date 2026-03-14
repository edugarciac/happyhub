## 1. Database schema

- [x] 1.1 Add `email_verified BOOLEAN DEFAULT false` column to `users` table
- [x] 1.2 Create `email_verification_tokens` table (id, user_id FK, token VARCHAR unique, expires_at TIMESTAMP, used BOOLEAN DEFAULT false, created_at TIMESTAMP)
- [x] 1.3 Add index on `email_verification_tokens.token` for fast lookup
- [x] 1.4 Update `initializeSchema` and `ensureUsersTable` in `src/lib/db.ts` to include new column and table
- [x] 1.5 Set `email_verified = true` for all existing seed/demo users

## 2. Verification token utilities

- [x] 2.1 Create `src/utils/emailVerification.ts` with functions: `generateVerificationToken(userId)`, `validateVerificationToken(token)`, `invalidateUserTokens(userId)`
- [x] 2.2 Token generation: 32 bytes crypto random hex, 24-hour expiry, store in DB
- [x] 2.3 Token validation: check exists, not expired, not used; return user_id on success

## 3. Email sending

- [x] 3.1 Create `src/lib/email.ts` with `sendVerificationEmail(email, name, verificationUrl)` function
- [x] 3.2 Implement email sending via n8n webhook (primary) or direct SMTP/SendGrid (fallback)
- [x] 3.3 Create HTML email template with HappyHub branding, verification button/link, and expiry notice

## 4. API endpoints

- [x] 4.1 Modify `POST /api/auth/register` to: set `email_verified = false`, generate verification token, send verification email, include `emailVerified: false` in JWT payload
- [x] 4.2 Create `POST /api/auth/verify-email` endpoint: accepts `{ token }`, validates token, sets `email_verified = true`, returns success with new JWT (emailVerified: true)
- [x] 4.3 Create `POST /api/auth/resend-verification` endpoint: requires auth, checks user is unverified, invalidates old tokens, generates new token, sends email
- [x] 4.4 Update JWT payload to include `emailVerified` boolean in all auth flows (login, register, token refresh)

## 5. Frontend pages

- [x] 5.1 Create `/verify-email` page: reads `token` from query params, calls verify API, shows success/error/expired states
- [x] 5.2 Create verification-pending page shown after registration: "Revisa tu email" message with email address and resend button
- [x] 5.3 Modify registration page flow to redirect to verification-pending page after successful registration instead of dashboard

## 6. Frontend - access control and banner

- [x] 6.1 Create `VerificationBanner` component: persistent top banner for unverified users with "Verifica tu email" message and resend link
- [x] 6.2 Add `VerificationBanner` to app layout (show when authenticated but `emailVerified = false`)
- [x] 6.3 Add email verification check to protected routes (booking, profile edit): redirect unverified users to verification-pending page
- [x] 6.4 Update auth context/state to track `emailVerified` from JWT

## 7. Google OAuth handling

- [x] 7.1 Modify Google OAuth registration flow to set `email_verified = true` automatically (no verification email needed)
- [x] 7.2 Ensure Google OAuth JWT payload includes `emailVerified: true`

## 8. Testing

- [x] 8.1 Test registration sends verification email and creates unverified user
- [x] 8.2 Test valid token verification marks email as verified
- [x] 8.3 Test expired and invalid tokens show appropriate errors
- [x] 8.4 Test resend invalidates old tokens and sends new email
- [x] 8.5 Test unverified users are blocked from protected routes
- [x] 8.6 Test Google OAuth users are auto-verified
