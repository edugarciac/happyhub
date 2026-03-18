# Tasks: login flow and role-based routing

## T1: Fix Google OAuth JWT role from DB
- **File**: `src/lib/auth.ts`
- **What**: In the `signIn` callback, after Google user creation or lookup, read the DB user via `getUserByEmail()` and attach `role`, `id`, and `email_verified` to the NextAuth user object.
- **Why**: Currently Google sign-in always gets `role: 'client'` in the JWT because the Google profile object has no `role` field.
- **Status**: pending

## T2: Role-aware redirect after credentials login
- **File**: `src/pages/login.tsx`
- **What**: After successful `signIn('credentials')`, fetch `/api/auth/session` to get the role, then redirect to `/admin/dashboard` if admin or `/area-privada` otherwise.
- **Why**: Currently hardcoded to always push to `/area-privada`.
- **Status**: pending

## T3: Header nav link per role (done)
- **File**: `src/components/Header.tsx`
- **What**: Show "Panel admin" for admin users, "Area privada" for others.
- **Status**: done

## T4: area-privada admin redirect fallback (done)
- **File**: `src/pages/area-privada.tsx`
- **What**: Redirect admin users to `/admin/dashboard` on page load.
- **Status**: done
