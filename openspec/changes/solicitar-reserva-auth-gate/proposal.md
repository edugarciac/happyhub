## Why

HappyHub necesita restringir temporalmente quién puede iniciar una solicitud de reserva. El CTA "Solicitar Reserva" (header) y el flujo `/reservas` (`BookingWizard`) están hoy abiertos a cualquier visitante, con o sin sesión. Se requiere limitar el acceso a una lista concreta de cuentas autorizadas mientras la plataforma no está en lanzamiento público.

## What Changes

- Se añade un allowlist de emails configurable por variable de entorno (`NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS`), sin hardcodear las cuentas en el código.
- El botón "Solicitar Reserva" del `Header` (versión desktop y menú móvil) se muestra deshabilitado cuando no hay sesión activa o la sesión activa no pertenece a un email de la allowlist.
- La página `/reservas` (que monta `BookingWizard`) queda protegida: sin sesión redirige a `/login`; con sesión pero email no autorizado redirige a una nueva página informativa `/reserva-restringida`.
- No se modifica el sistema de roles ni las APIs de reserva (`/api/webhook-reserva`, `/api/create-checkout-session`); el control es de acceso a la UI del flujo de solicitud, no de autorización de backend.

## Capabilities

### New Capabilities

- `booking-request-access-gate`: Control de acceso por allowlist de emails para iniciar una solicitud de reserva (botón CTA + página `/reservas`).

### Modified Capabilities

_(ninguna — no existían specs previas sobre el CTA de reserva)_

## Impact

- `src/utils/bookingAccess.ts` (nuevo) — helper para leer y comprobar la allowlist.
- `src/components/Header.tsx` — CTA "Solicitar Reserva" deshabilitado según allowlist.
- `src/pages/reservas.tsx` — gate de acceso antes de renderizar `BookingWizard`.
- `src/pages/reserva-restringida.tsx` (nuevo) — página informativa para sesión no autorizada.
- `.env.example` — nueva variable `NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS`.
- Requiere configurar `NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS` en Vercel (y `.env.local` en desarrollo) con las cuentas reales autorizadas; sin esa variable, el botón queda deshabilitado para todo el mundo.
