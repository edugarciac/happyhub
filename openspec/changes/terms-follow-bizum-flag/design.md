## Decisions

- **Interruptor, no borrado**: igual que la FAQ (`{{metodos_senal}}`), el texto depende de `BIZUM_ENABLED`; al reactivar Bizum los términos vuelven solos.
- **El contrato refleja la reserva, no el interruptor**: es el documento de una reserva concreta. Si se pagó por Bizum antes de desactivarlo, debe seguir diciéndolo. Sin `payment_method`, se usa `BIZUM_ENABLED`.
- **Versión de los términos**: se mantiene `TERMS_LAST_UPDATED = '25 de octubre de 2026'` (mismo día que el cambio anterior). Cada aceptación guarda además el texto completo y su hash, que distinguen ambas redacciones.
