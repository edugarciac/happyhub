## ADDED Requirements

### Requirement: Solicitar Reserva CTA is gated by an email allowlist
El sistema SHALL deshabilitar el botón/enlace "Solicitar Reserva" del `Header` (versión escritorio y menú móvil) salvo que exista una sesión next-auth activa cuyo email esté incluido en la allowlist configurada por `NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS`.

#### Scenario: Usuario sin sesión ve el CTA deshabilitado
- **WHEN** un visitante sin sesión activa visita cualquier página con `Header`
- **THEN** el sistema MUST mostrar "Solicitar Reserva" deshabilitado (sin navegación a `/reservas`)

#### Scenario: Usuario con sesión no autorizada ve el CTA deshabilitado
- **WHEN** un usuario ha iniciado sesión con un email que no está en la allowlist
- **THEN** el sistema MUST mostrar "Solicitar Reserva" deshabilitado

#### Scenario: Usuario autorizado ve el CTA habilitado
- **WHEN** un usuario ha iniciado sesión con un email presente en la allowlist
- **THEN** el sistema MUST mostrar "Solicitar Reserva" como enlace activo hacia `/reservas`

### Requirement: `/reservas` bloquea el acceso directo a usuarios no autorizados
El sistema SHALL impedir que `/reservas` renderice `BookingWizard` para sesiones no autorizadas, incluso si se accede directamente por URL.

#### Scenario: Acceso directo sin sesión
- **WHEN** un visitante sin sesión navega directamente a `/reservas`
- **THEN** el sistema MUST redirigir a `/login`

#### Scenario: Acceso directo con sesión no autorizada
- **WHEN** un usuario con sesión activa pero email fuera de la allowlist navega a `/reservas`
- **THEN** el sistema MUST redirigir a `/reserva-restringida`

#### Scenario: Acceso directo con sesión autorizada
- **WHEN** un usuario con sesión activa y email en la allowlist navega a `/reservas`
- **THEN** el sistema MUST renderizar `BookingWizard` con normalidad (respetando también el check de `emailVerified` ya existente)

### Requirement: Allowlist configurable por variable de entorno
El sistema SHALL leer la lista de emails autorizados desde `NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS` (lista separada por comas), sin emails hardcodeados en el código fuente.

#### Scenario: Comparación insensible a mayúsculas y espacios
- **WHEN** la allowlist contiene `Foo@Example.com` y la sesión tiene email `foo@example.com`
- **THEN** el sistema MUST considerar el email autorizado

#### Scenario: Variable no configurada
- **WHEN** `NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS` no está definida o está vacía
- **THEN** el sistema MUST tratar la allowlist como vacía (ningún usuario autorizado)
