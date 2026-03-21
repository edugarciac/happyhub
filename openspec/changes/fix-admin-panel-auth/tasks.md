## 1. AdminLayout auth migration

- [x] 1.1 Reemplazar `localStorage.getItem('token')` por `useSession()` de next-auth en `AdminLayout.tsx`
- [x] 1.2 Añadir verificación de rol `admin` en la sesión (`(session.user as any)?.role !== 'admin'`)
- [x] 1.3 Retornar `null` durante `status === 'loading'` para evitar flash

## 2. Logout

- [x] 2.1 Reemplazar `localStorage.removeItem('token')` + `router.push` por `signOut({ callbackUrl: '/' })`
- [x] 2.2 Eliminar import de `useRouter` si ya no es necesario (se mantiene por el redirect de no-admin)

## 3. Verificación

- [x] 3.1 Verificar que admin puede acceder a `/admin/dashboard` tras login con next-auth
- [x] 3.2 Verificar que usuario sin sesión es redirigido a `/login`
- [x] 3.3 Verificar que usuario con rol `client` es redirigido a `/login`
