## Why

El popup de inauguración salía cada vez que se abría un enlace (correos de aprobación, de pago, etc.) y en cualquier página, incluida `/pagar`:
- Recordaba el cierre solo durante la sesión (`sessionStorage`), y cada enlace de un correo abre una pestaña o sesión nueva, a menudo en el navegador interno de Gmail.
- Se mostraba en todas las rutas.

## What Changes

- El popup **solo aparece en la portada** (`/`).
- Al cerrarlo **no vuelve en 24 horas**, aunque se abra otra pestaña (`localStorage` con la hora de cierre).
- Sigue desapareciendo solo tras el día de la inauguración.

## Impact

- `src/components/ComingSoonOverlay.tsx`
