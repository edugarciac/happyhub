## Decisions

1. **Eliminar el código** de la lista en lugar de dejarla vacía o apagada con una variable: era explícitamente temporal, y dejarla aumenta el riesgo de que vuelva a bloquear reservas por una variable mal configurada.
2. **No se toca la autenticación ni la verificación de email**: siguen siendo el control de acceso al flujo de reserva.

## Risks / Trade-offs

- Cualquier usuario registrado y verificado puede enviar solicitudes. Es el comportamiento buscado; las reservas siguen pasando por aprobación y pago.
