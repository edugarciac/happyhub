# Spec: credentials login flow

## Preconditions
- User has an account in the `users` table with a valid password hash.

## Flow

1. User enters email and password on `/login`.
2. `signIn('credentials', { redirect: false, email, password })` is called.
3. NextAuth `authorize` callback calls `verifyPassword(email, password)`.
4. If invalid credentials, show error "Email o contrasena incorrectos".
5. If valid, `authorize` returns `{ id, email, name, role, emailVerified }` from the DB.
6. `jwt` callback stores `role` in the token.
7. `session` callback exposes `role` in `session.user.role`.
8. Login page fetches the fresh session to read the role.
9. If `role === 'admin'`, redirect to `/admin/dashboard`.
10. Otherwise, redirect to `/area-privada`.

## Acceptance criteria

- [x] Credentials login with valid email/password works.
- [ ] After login, admin users land on `/admin/dashboard`.
- [ ] After login, client users land on `/area-privada`.
- [x] Invalid credentials show an error message.
