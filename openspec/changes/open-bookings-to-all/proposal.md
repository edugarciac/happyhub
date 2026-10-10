## Why

HappyHub se inaugura el 16 de octubre y ya acepta reservas a partir de esa fecha. La lista de cuentas autorizadas (`NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS`, del cambio `solicitar-reserva-auth-gate`) era temporal, para la fase de pruebas. Ahora impide reservar a los clientes reales: les sale "acceso restringido". El propietario ha confirmado que hay que quitarla.

## What Changes

- Botón "Solicitar Reserva" del Header (escritorio y móvil) siempre activo
- `/reservas` deja de redirigir a `/reserva-restringida`
- Se eliminan `src/utils/bookingAccess.ts`, la página `/reserva-restringida` y la variable en `.env.example`

## Se mantiene

- Hay que iniciar sesión (si no, se redirige a `/login`)
- Hay que tener el email verificado (si no, se redirige a `/verificacion-pendiente`)
- Solo se aceptan fechas desde el 16 de octubre (calendario y API)

## Capabilities

### Removed Capabilities

- `booking-request-access-gate`

## Impact

- `src/components/Header.tsx`, `src/pages/reservas.tsx`
- La variable `NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS` en Vercel deja de usarse (se puede borrar)
