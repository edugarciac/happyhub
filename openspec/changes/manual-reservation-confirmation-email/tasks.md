## 1. Notificación de reservas manuales
- [x] 1.1 Helper `sendReservationRequestNotifications` (correo al cliente + evento Calendar)
- [x] 1.2 Llamarlo al crear la reserva manual y devolver `emailWarning` si falla
- [x] 1.3 Endpoint `POST /api/admin/reservations/[id]/resend-confirmation`
- [x] 1.4 Botón "Reenviar correo" en el listado admin (pendientes) y aviso en el formulario de alta

## 2. Verificar
- [x] 2.1 Typecheck, lint y tests
- [ ] 2.2 Reenviar el correo de #43 y #44 desde el panel tras el despliegue
