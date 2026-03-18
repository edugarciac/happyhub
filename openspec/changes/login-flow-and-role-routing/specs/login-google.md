# Spec: Google OAuth login flow

## Preconditions
- `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true` and Google client credentials are set.

## Flow

1. User clicks "Continua con Google" on `/login`.
2. `signIn('google', { callbackUrl: '/area-privada' })` triggers full-page redirect to Google.
3. Google authenticates the user and redirects back.
4. NextAuth `signIn` callback fires with `account.provider === 'google'`.
5. Callback calls `getUserByEmail(user.email)`.
6. **If user does NOT exist**: call `createUser({ email, name, role: 'client', email_verified: true })`.
7. **If user exists**: no creation needed.
8. In both cases, read the DB user to get the real `role` and attach it to the NextAuth user object: `(user as any).role = dbUser.role`.
9. `jwt` callback stores the DB role in the token (not the default `'client'`).
10. `session` callback exposes `role` in `session.user.role`.
11. User lands on `/area-privada` (the callbackUrl).
12. `area-privada.tsx` checks `session.user.role`:
    - If `admin`, `router.replace('/admin/dashboard')`.
    - If `client`, render the private area (datos personales + mis reservas).

## Acceptance criteria

- [x] Google login creates a new user if not existing (role: client, email_verified: true).
- [ ] Google login for an existing user reads the current role from DB (not hardcoded 'client').
- [ ] Admin users arriving at `/area-privada` via Google callback get redirected to `/admin/dashboard`.
- [ ] Client users see their personal data and reservations.
