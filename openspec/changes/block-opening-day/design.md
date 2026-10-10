## Decisions

1. **Separar la inauguración del inicio de reservas** (`OPENING_DATE` frente a `BOOKINGS_FROM_DATE`): la cuenta atrás sigue llegando al 16, y las reservas empiezan el 17.
2. **Código y no un bloqueo manual en el admin**: el día de la inauguración es una regla fija del negocio, no un bloqueo puntual, y así no depende de que nadie lo desbloquee por error.
3. **`blocked_slots` en la misma sentencia atómica** (`AND NOT EXISTS`) que la comprobación de reservas, para que el servidor respete los bloqueos del admin igual que el calendario.
