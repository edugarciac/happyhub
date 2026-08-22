## Context

El flujo de reserva (`Header` CTA → `/reservas` → `BookingWizard`) no comprobaba sesión salvo por la verificación de `emailVerified` ya existente en `reservas.tsx`. Se pide restringir el inicio de una solicitud de reserva a dos cuentas concretas, configurables (no hardcodeadas), sin afectar al resto de la aplicación (login, área privada, panel admin).

## Goals / Non-Goals

**Goals:**
- Deshabilitar visualmente el CTA "Solicitar Reserva" cuando el visitante no ha iniciado sesión o su email no está en la allowlist.
- Bloquear el acceso directo a `/reservas` (bypass por URL) con la misma regla.
- Permitir cambiar la allowlist sin desplegar código (variable de entorno).

**Non-Goals:**
- No se cambia el modelo de roles (`admin`/`client`) ni `next-auth`.
- No se añade verificación server-side en `/api/webhook-reserva` ni `/api/create-checkout-session` (fuera de alcance acordado; el gate es de acceso a la UI del flujo, no de la API de envío).
- No se elimina el check de `emailVerified` existente en `reservas.tsx`; ambas comprobaciones conviven.

## Decisions

### Allowlist vía `NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS`

**Decisión**: Lista de emails separados por coma en una variable de entorno pública (`NEXT_PUBLIC_*`), parseada por un helper compartido `src/utils/bookingAccess.ts` (`isBookingAllowedEmail(email)`).

**Alternativa considerada**: Hardcodear los dos emails en el código.

**Rationale**: El usuario pidió explícitamente poder cambiar la lista sin tocar código. Al ser una comprobación de acceso a UI (no protege datos sensibles del backend), usar una variable `NEXT_PUBLIC_` client-side es aceptable — el mismo helper se reutiliza en el servidor (`getServerSideProps`/`useEffect` client-side) sin duplicar lógica.

### Reutilizar el patrón `useSession` + `useEffect` de `area-privada.tsx` / `reservas.tsx`

**Decisión**: En `reservas.tsx`, ampliar el `useEffect` existente: `status === 'unauthenticated'` → `router.replace('/login')`; sesión autenticada pero email no permitido → `router.replace('/reserva-restringida')`. Mientras `status === 'loading'` o se está redirigiendo, no se renderiza `BookingWizard`.

**Rationale**: Consistente con el resto de la app (mismo idioma de guard usado en `area-privada.tsx` y `AdminLayout.tsx`), evita flash de contenido no autorizado.

### Botón deshabilitado, no oculto

**Decisión**: El CTA "Solicitar Reserva" permanece visible pero deshabilitado (`opacity-50`, `cursor-not-allowed`, `aria-disabled`, sin navegación) cuando no está permitido, con un `title` explicativo.

**Rationale**: Así lo pidió el usuario ("debe aparecer deshabilitado"), en vez de ocultarlo, para dejar claro que la función existe pero requiere una cuenta autorizada.

## Risks / Trade-offs

- [Variable `NEXT_PUBLIC_`] → los emails de la allowlist quedan visibles en el bundle del cliente. Aceptable: son emails, no credenciales, y el propio objetivo es una comprobación de UI, no un límite de seguridad fuerte.
- [Sin verificación server-side en las APIs] → un usuario autorizado que inspeccione la red podría, en teoría, llamar a `/api/webhook-reserva` directamente sin pasar por el gate de UI. Aceptable para este cambio: acordado explícitamente que el alcance es solo CTA + página `/reservas`, no las APIs.
- [Env var sin configurar] → si `NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS` no se define en Vercel, la allowlist queda vacía y el botón se deshabilita para todos, incluidas las cuentas que deberían tener acceso. Se documenta explícitamente en el proposal.
