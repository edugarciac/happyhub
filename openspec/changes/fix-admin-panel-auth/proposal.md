## Why

El panel de administración (`/admin/dashboard`) no era accesible. `AdminLayout` verificaba autenticación con `localStorage.getItem('token')`, pero el sistema de login usa next-auth (sesión por cookie JWT). Nunca se guardaba token en localStorage, por lo que siempre redirigía a `/login`.

## What Changes

- **BREAKING**: `AdminLayout` reemplaza verificación por localStorage con `useSession()` de next-auth
- El logout del panel admin usa `signOut()` de next-auth en vez de borrar localStorage
- Se añade verificación de rol `admin` en la sesión antes de permitir acceso
- Se muestra pantalla vacía mientras carga la sesión (evita flash de contenido)

## Capabilities

### New Capabilities

- `admin-session-auth`: Autenticación del panel admin mediante next-auth session con verificación de rol

### Modified Capabilities

_(ninguna — no existían specs previas)_

## Impact

- `src/components/admin/AdminLayout.tsx` — componente principal reescrito
- Todas las páginas bajo `/admin/*` que usan `AdminLayout` se benefician del fix
- Dependencia: `next-auth/react` (ya existente en el proyecto)
