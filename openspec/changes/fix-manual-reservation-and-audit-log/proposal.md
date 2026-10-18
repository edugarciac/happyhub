## Why

El 18/10/2026 a las 16:21 (UTC) falló una reserva manual creada desde el panel admin para una clienta nueva: `POST /api/admin/reservations` intenta crear el usuario sin `password_hash`, que es `NOT NULL` → error 23502 y no se crea ni el usuario ni la reserva. La misma clienta no pudo hacer login/reserva en la web y no queda ninguna traza: los fallos de login no se registran y Vercel Hobby solo guarda los logs 1 hora.

## What Changes

- Reserva manual: el usuario nuevo se crea con un `password_hash` inutilizable (hash bcrypt de un secreto aleatorio), como en el alta con Google; podrá fijar su contraseña con "¿Has olvidado tu contraseña?". Búsqueda del usuario por email sin distinguir mayúsculas. El admin ve el motivo real del error.
- Nueva tabla `audit_events` (persistente en Neon) y helper `recordAuditEvent`, que nunca rompe la petición
- Se registran: login con contraseña (éxito / motivo del fallo), login con Google, registro, cada intento de reserva web (éxito o rechazo con `step`, estado HTTP y error) y cada reserva manual del admin
- Cada evento guarda: tipo, resultado, email, IP, user-agent, id de petición de Vercel, estado HTTP y un detalle JSON sin contraseñas ni el texto de los términos

## Capabilities

### New Capabilities

- `audit-log`: registro persistente de intentos de login y reserva para análisis forense

## Impact

- `src/lib/audit.ts` (nuevo), `src/lib/auth.ts`, `src/pages/api/auth/register.ts`, `src/pages/api/webhook-reserva.ts`, `src/pages/api/admin/reservations.ts`
- BD: tabla `audit_events` (creación idempotente) + `database/migrations/030_audit_events.sql`
