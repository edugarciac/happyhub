# Proposal: login flow and role-based routing

## Problem

The current login flow has several gaps:

1. **Google OAuth auto-creation works but the JWT role is not read from DB** - When a Google user signs in for the first time, a new `client` row is created in `users`. However the `jwt` callback reads `(user as any).role`, which comes from the NextAuth `User` object, not from the DB row. For Google sign-ins the NextAuth `User` object does not carry a `role` field, so the token defaults to `'client'`. This is correct for new users but wrong for existing users whose role was changed to `admin` in the DB - their JWT still says `client` until they re-authenticate with credentials.

2. **Post-login redirect is hardcoded** - Both the credentials flow (`router.push('/area-privada')`) and the Google flow (`callbackUrl: '/area-privada'`) always send users to `/area-privada`. Admin users must manually navigate to `/admin/dashboard`.

3. **area-privada redirect is client-side only** - The current redirect in `area-privada.tsx` fires after the page loads, causing a flash. There is no server-side redirect.

## Solution

Fix the auth pipeline so that:
- Google OAuth creates the user if it doesn't exist (already works).
- The JWT always reflects the DB role, not just the NextAuth User object.
- After login, admins go to `/admin/dashboard` and non-admins go to `/area-privada`.
- The Header nav shows "Panel admin" for admins and "Area privada" for clients (already done).

## Scope

- `src/lib/auth.ts` - fix JWT callback to read role from DB
- `src/pages/login.tsx` - role-aware redirect after credentials login
- `src/pages/area-privada.tsx` - keep client-side redirect as fallback
- No new pages, no DB schema changes
