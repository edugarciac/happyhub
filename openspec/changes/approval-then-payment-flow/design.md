## Context

Ya existen: `payment_tokens` + `/pagar/[token]` + `/api/payments/remaining` (pago del resto con Stripe), `webhook-reserva` (solicitud, sin n8n), `status.ts` (botón Aprobar/Cancelar del panel), Resend para correos.

## Decisions

1. **Reutilizar `payment_tokens`** con `token_type = 'deposit'` y `expires_at = payment_due_at`. `/api/payments/remaining` se generaliza: según el tipo de token cobra la señal (`deposit_amount`) o el resto.
2. **`payment_due_at` en la reserva** (no solo en el token): es la fuente de verdad para la caducidad y permite mostrar "plazo vencido" en el panel.
3. **Caducidad perezosa + cron**: Vercel Hobby solo permite cron diario, insuficiente para 24 h exactas. Por eso `expireUnpaidReservations()` se ejecuta también al cargar disponibilidad (`booked-slots`) y antes de insertar una reserva. Así una franja vencida queda libre en cuanto alguien la mira. El cron diario cubre el resto (correo al cliente aunque nadie visite la web).
4. **Expirar con `UPDATE … RETURNING`**, atómico: aunque se ejecute en paralelo, cada reserva se cancela y se notifica una sola vez.
5. **Estado tras el pago**: se mantiene `status = 'approved'` y `payment_status = 'deposit_paid'`. No se añade un estado nuevo para no romper los filtros y transiciones del panel.
6. **Bizum manual**: Stripe no admite Bizum. Botón admin que registra `deposit_paid = deposit_amount`.
7. **Columnas nuevas**: migración SQL `023` + `ensureReservationFlowColumns()` idempotente (`ADD COLUMN IF NOT EXISTS`, una vez por instancia), igual que otras migraciones del proyecto en `lib/db.ts`.
8. **Festivos**: siguen pasando por la misma aprobación; el aviso al admin ya los marca.

## Risks / Trade-offs

- Si el correo de aprobación no llega (spam), el cliente puede perder el plazo. Mitigación: el correo se envía con Resend desde el dominio verificado, y el admin ve en el panel cuándo vence.
- Reservas `pending` antiguas creadas con el flujo anterior (tarjeta) no tienen `payment_method`. Al aprobarlas se tratan como tarjeta.
