# Spec: role-based routing after login

## Routes by role

| Role     | Nav label      | Link target          | area-privada behavior         |
|----------|----------------|----------------------|-------------------------------|
| admin    | Panel admin    | /admin/dashboard     | Redirect to /admin/dashboard  |
| client   | Area privada   | /area-privada        | Show profile + reservations   |
| provider | Area privada   | /area-privada        | Show profile + reservations   |

## Header behavior

- Authenticated admin: show "Panel admin" linking to `/admin/dashboard`.
- Authenticated non-admin: show "Area privada" linking to `/area-privada`.
- Not authenticated: no private link shown.

## /area-privada page behavior

- If not authenticated: redirect to `/login`.
- If authenticated and `role === 'admin'`: `router.replace('/admin/dashboard')`.
- If authenticated and `role !== 'admin'`: render datos personales and mis reservas.

## Acceptance criteria

- [x] Header shows correct label per role.
- [x] area-privada redirects admins to admin dashboard.
- [ ] Credentials login redirects based on role without visiting area-privada first.
