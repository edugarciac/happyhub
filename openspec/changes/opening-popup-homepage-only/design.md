## Decisions

1. **Solo en la portada**: es un mensaje de bienvenida. En páginas a las que se llega con un propósito (pagar, reservar, términos, admin) solo estorba.
2. **24 h en `localStorage`** en lugar de por sesión: sobrevive a pestañas nuevas. Pasado un día puede volver a recordar la cuenta atrás a quien regresa.
3. Si el navegador bloquea el almacenamiento, el popup se muestra (comportamiento seguro, solo en la portada).
