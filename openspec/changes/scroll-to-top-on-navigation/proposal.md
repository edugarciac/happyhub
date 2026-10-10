## Why

Al abrir una página nueva o avanzar de paso en la reserva, la vista empezaba al final en lugar de arriba.

Causas:
1. `globals.css` aplicaba `scroll-behavior: smooth` a **todos** los elementos (`* { … }`). El salto arriba que hace Next.js al navegar se animaba y se interrumpía al cargar la página nueva, que cambia de altura.
2. El asistente de reserva cambia de paso sin navegar de página y no subía arriba. Como el botón "Continuar" está abajo, el paso siguiente se mostraba desde el final.

## What Changes

- Se elimina el `scroll-behavior: smooth` global. El único desplazamiento suave real (botón del Hero) ya lo pide explícitamente con `scrollIntoView({ behavior: 'smooth' })`.
- `BookingProvider`: al cambiar de paso, `window.scrollTo(0, 0)`.

## Impact

- `src/styles/globals.css`, `src/components/booking/BookingContext.tsx`
