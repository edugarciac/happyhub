## Decisions

- **HTML/Tailwind, no imagen**: se ve nítido en móvil, se puede leer con lector de pantalla y se actualiza con el código.
- **Fuente única**: etiquetas y colores de `DISPLAY_STATUS_*`; plazos de `PAYMENT_WINDOW_HOURS`, `PAYMENT_GRACE_HOURS`, `REMAINING_REMINDER_DAYS_BEFORE` y `SECURITY_DEPOSIT_AMOUNT`. `REMAINING_REMINDER_DAYS_BEFORE` pasa de `lib/reservationFlow` (servidor) a `config/payments` para poder usarlo en el navegador.
- **Leyenda**: botón del admin frente a automático (Stripe o aviso diario).
