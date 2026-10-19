## Why

En iPad (1024-1194px en horizontal) el botón "Solicitar Reserva" de la cabecera se corta por la derecha. La navegación de escritorio se activa desde `lg` (1024px) pero necesita ~1115px sin sesión y ~1300px con sesión (el recuadro con el email ocupa ~230px), así que con sesión iniciada también desborda en portátiles.

## What Changes

- La navegación de escritorio pasa de `lg` (1024px) a `xl` (1280px); por debajo se usa el menú hamburguesa (incluye iPad en horizontal)
- Con sesión iniciada, el recuadro con el email se sustituye por un avatar circular con la inicial del email (email completo en tooltip) + botón de cerrar sesión
- El menú móvil no cambia (sigue mostrando el email completo)

## Capabilities

### Modified Capabilities

- `site-header`: la cabecera nunca desborda horizontalmente

## Impact

- **Frontend**: `src/components/Header.tsx` únicamente
