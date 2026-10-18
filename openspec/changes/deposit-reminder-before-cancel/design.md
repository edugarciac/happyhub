## Decisions

- **Plazos**: `PAYMENT_WINDOW_HOURS = 24` (plazo de pago, marca el recordatorio) y `PAYMENT_GRACE_HOURS = 24` (margen tras el recordatorio).
- **Recordatorio**: `sendDepositReminders()` marca con un `UPDATE … RETURNING` atómico las reservas `approved`, sin pagar, con `payment_due_at < NOW()` y `payment_reminder_sent_at IS NULL`. Así cada una se avisa una sola vez aunque haya ejecuciones en paralelo. En el mismo UPDATE se mueve `payment_due_at` a `date_trunc('hour', GREATEST(payment_due_at, NOW())) + 24 h`; el redondeo a la hora evita que el cron diario del día siguiente, que puede correr unos segundos antes, deje la cancelación para un día más tarde. El plazo nuevo es real aunque el recordatorio salga tarde, y el cliente siempre tiene 24 h desde el aviso.
- **Enlace**: se alarga la caducidad de los enlaces de pago de señal sin usar hasta el nuevo plazo, y el correo lleva un enlace nuevo.
- **Cancelación**: `expireUnpaidReservations` exige además `payment_reminder_sent_at IS NOT NULL`. Las reservas aprobadas antes de este cambio (plazo de 24 h ya fijado) reciben primero el recordatorio y no se cancelan de golpe.
- **Orden**: en cada ejecución primero se cancela y después se envían recordatorios. Así, una reserva recién avisada nunca se cancela en la misma pasada.
- **Frecuencia**: cron diario de Vercel (07:00 UTC) más el listado de admin (avisa y cancela) y la disponibilidad/reserva web (solo cancela). El recordatorio puede salir hasta un día después de las 24 h; el cliente siempre tiene 24 h desde el aviso.
- **Sin email**: se marca el recordatorio igualmente (no se puede enviar), para que el flujo siga y la reserva se cancele a las 48 h.

## Risks

- Con el cron diario, el aviso y la cancelación pueden retrasarse hasta un día respecto a las 24 h / 48 h exactas.
