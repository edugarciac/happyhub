## Context

`AdminLayout` es el wrapper de todas las páginas del panel admin (`/admin/*`). Usaba `localStorage.getItem('token')` para verificar autenticación, pero el sistema de login migró a next-auth hace tiempo. next-auth almacena la sesión en cookies HTTP-only con JWT, no en localStorage. Resultado: el panel admin era inaccesible para cualquier usuario.

## Goals / Non-Goals

**Goals:**
- Unificar la autenticación del admin panel con next-auth (mismo mecanismo que el resto de la app)
- Verificar rol `admin` antes de renderizar contenido
- Logout consistente con el resto de la aplicación

**Non-Goals:**
- No se cambia el sistema de roles ni se añaden nuevos roles
- No se implementa RBAC granular (permisos por página)
- No se modifican las APIs admin (ya tienen su propia verificación con `requireAdmin`)

## Decisions

### Usar `useSession()` en vez de middleware next-auth

**Decisión**: Verificar sesión client-side con `useSession()` hook.

**Alternativa considerada**: Middleware de next-auth para proteger rutas `/admin/*` server-side.

**Rationale**: El middleware requiere configuración adicional y el patrón client-side es consistente con cómo el Header ya maneja la sesión. Las APIs admin ya verifican auth independientemente.

### Render null mientras carga sesión

**Decisión**: Retornar `null` durante `status === 'loading'` para evitar flash de contenido no autorizado.

**Rationale**: Previene que se muestre brevemente el panel admin antes de redirigir a login.

## Risks / Trade-offs

- [Client-side auth check] → Un usuario podría ver un flash del layout antes de redirect si la sesión tarda. Mitigado con el `return null` durante loading.
- [No middleware server-side] → Las páginas admin se cargan en el cliente antes de verificar. Aceptable porque las APIs ya verifican auth independientemente y no exponen datos sensibles en el HTML inicial.
