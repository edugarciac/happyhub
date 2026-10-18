## Decisions

- **Orden**: `ORDER BY r.id DESC`. El código visible es `#id`, que crece con cada reserva, así que equivale a orden de creación. La paginación (LIMIT/OFFSET) sigue siendo estable porque `id` es único.
- **Hora**: nuevo `formatDateTime` con `toLocaleString('es-ES', … timeZone: 'Europe/Madrid')`, para que la hora sea la del local y no la del navegador. La fecha del evento sigue sin hora.
