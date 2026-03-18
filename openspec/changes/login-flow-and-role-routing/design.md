# Design: login flow and role-based routing

## Auth flow diagram

```
User clicks Login
        |
        v
  +-- Credentials --+-- Google OAuth --+
  |                  |                  |
  v                  v                  |
verifyPassword()   signIn callback      |
  |                  |                  |
  | user exists?     | user exists?     |
  | NO -> error      | NO -> createUser(role='client', email_verified=true)
  | YES -> return    | YES -> continue  |
  |   user w/ role   |                  |
  +--------+---------+---------+--------+
           |                   |
           v                   v
      jwt callback         jwt callback
      read role from       read role from DB
      user object          via getUserByEmail()
           |                   |
           +-------+-----------+
                   |
                   v
            session callback
            attach id, role, authMethod, emailVerified
                   |
                   v
            Post-login redirect
            role === 'admin' ? /admin/dashboard : /area-privada
```

## Component changes

### 1. `src/lib/auth.ts` - JWT callback fix

Current problem: for Google sign-ins, the `user` object from NextAuth does not contain `role` because it comes from Google's profile, not our DB. The jwt callback does `token.role = (user as any).role || 'client'` which always falls back to `'client'`.

Fix: in the `signIn` callback, after finding or creating the user, attach the DB role to the NextAuth user object. Alternatively, in the `jwt` callback, when `account?.provider === 'google'`, look up the user in the DB to get the real role.

Chosen approach: enrich the user object in `signIn` callback by reading the DB user after creation/lookup, and attaching `role` and `id` to the user object so the `jwt` callback receives them correctly.

```typescript
// In signIn callback, after Google user creation/lookup:
const dbUser = await getUserByEmail(user.email);
if (dbUser) {
  (user as any).role = dbUser.role;
  (user as any).id = dbUser.id.toString();
  (user as any).emailVerified = dbUser.email_verified;
}
```

### 2. `src/pages/login.tsx` - role-aware redirect

After successful credentials login, fetch the session to check the role before redirecting:

```typescript
// After signIn('credentials', { redirect: false }) succeeds:
const sessionRes = await fetch('/api/auth/session');
const sessionData = await sessionRes.json();
const dest = sessionData?.user?.role === 'admin' ? '/admin/dashboard' : '/area-privada';
router.push(dest);
```

For Google login, we cannot use `redirect: false` easily because Google OAuth requires a full page redirect. Instead, set `callbackUrl` to `/area-privada` and rely on the existing client-side redirect in `area-privada.tsx` to bounce admins to `/admin/dashboard`.

### 3. `src/pages/area-privada.tsx` - fallback redirect (already done)

The existing `useEffect` that redirects admins to `/admin/dashboard` stays as a safety net for direct URL access and Google OAuth callback.

### 4. `src/components/Header.tsx` - nav link (already done)

Admin users see "Panel admin" pointing to `/admin/dashboard`. Non-admins see "Area privada".

## Data model

No changes. The `users.role` column already supports `'client' | 'provider' | 'admin'`.

## Security

- Role is always read from the DB, never from client input.
- JWT is the single source of truth for the session; role is set at sign-in time.
- Admin pages already have their own auth guards via `AdminLayout` and API middleware.
