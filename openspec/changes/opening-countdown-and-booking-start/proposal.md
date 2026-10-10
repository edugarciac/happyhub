## Why

HappyHub se inaugura el **16 de octubre de 2026**. La web tiene que anunciarlo con claridad nada más entrar, con una cuenta atrás que se actualice cada día. Además, el calendario tiene que aceptar reservas solo a partir de esa fecha.

## What Changes

- **Popup de entrada** (`ComingSoonOverlay`): pasa de "¡Ya casi estamos listos!" a una cuenta atrás con la fecha en grande y los días que faltan. El botón principal lleva a "Ver fechas disponibles". Sale una vez por sesión y deja de mostrarse a partir del 17 de octubre.
- **Hero de la portada**: tarjeta con la cuenta atrás ("6 días · Inauguración · 16 de octubre"). El día 16 muestra "¡Hoy inauguramos!" y desaparece a partir del 17.
- **Calendario** (`FullCalendar`, usado en `/disponibilidad` y en el paso 1 de `/reservas`): los días anteriores al 16 de octubre aparecen como no disponibles. Si la inauguración aún no ha llegado, el calendario se abre en el mes de la inauguración.
- **API** `POST /api/webhook-reserva`: rechaza (400) reservas con fecha anterior al 16 de octubre.

## Capabilities

### New Capabilities

- `opening-countdown`: cuenta atrás de la inauguración en el popup de entrada y en el Hero
- `booking-start-date`: no se aceptan reservas anteriores a la fecha de inauguración

## Impact

- **Frontend**: `ComingSoonOverlay.tsx`, `Hero.tsx`, `FullCalendar.tsx`, nuevo `OpeningCountdown.tsx`
- **Config**: nuevo `src/config/opening.ts` (fecha única de inauguración)
- **API**: `webhook-reserva.ts` (validación de fecha)

## Fuera de alcance (pendiente)

- **Quitar la lista de cuentas autorizadas** (`NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS`) para que cualquier usuario registrado pueda reservar. Necesita confirmación explícita del propietario, porque relaja un control de acceso.
- **Sustituir las fotos generadas** por fotos reales del local: pendiente de recibir las fotos.
