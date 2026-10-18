## Decisions

- **Un único helper** `sendReservationRequestNotifications(id)` en `src/lib/reservationNotifications.ts`: lee la reserva + cliente de la BD, envía `reservationCustomerEmail` y crea el evento de Calendar si aún no existe (`google_calendar_event_id` nulo). Lo usan la creación manual y el reenvío. Nunca lanza.
- **Mismo correo que la web**: misma plantilla, mismo código `RES-YYYYMMDD-NNN`. Sin bloque de términos (no hay aceptación registrada en reservas manuales). Si `payment_method` es nulo se usa `card`, igual que en la aprobación.
- **Reenvío solo en `pending`**: el correo dice "pendiente de aprobación"; en `approved` el cliente ya recibe el correo de aprobación con el enlace de pago (`status.ts`), que funciona igual para reservas manuales.
- **Opción de no avisar**: `notifyClient: false` en el POST (casilla desmarcada) → `sendEmail: false` en el helper; solo se crea el evento de Calendar. Por defecto se envía, para que no se olvide.
- **Sin notificación al admin**: el creador es el admin; evita ruido.
- **La reserva no se anula si falla el envío**: se devuelve `emailWarning` y el admin puede reenviar.
