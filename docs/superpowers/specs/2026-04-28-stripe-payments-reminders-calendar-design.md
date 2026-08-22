# Design: Stripe Payments, Reminders & Calendar Delete

**Date:** 2026-04-28  
**Status:** Approved  
**Scope:** HappyHub — Módulo Evento Único (Fase 1)

---

## Resumen

Cinco funcionalidades nuevas sobre el MVP actual:

1. **Política de privacidad** — ya existe (`src/pages/politica-privacidad.tsx`), completa. No requiere trabajo.
2. **Pago de paga y señal con tarjeta** — lanzar Stripe Checkout al seleccionar "tarjeta" en el booking.
3. **Pago del importe restante** — desde área privada, panel de admin y link por email.
4. **Recordatorios de pago por email** — n8n cron a 30, 7 y 3 días antes del evento.
5. **Borrado íntegro de evento de calendario** — cancela reserva en DB y elimina del Google Calendar.

---

## 1. Cambios en base de datos

### Tabla `reservations` — nuevas columnas

```sql
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
  -- configurable por admin; si NULL usa 30% del total
  ADD COLUMN IF NOT EXISTS deposit_paid DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'pending',
  -- valores: 'pending' | 'pending_deposit' | 'deposit_paid' | 'fully_paid'
  ADD COLUMN IF NOT EXISTS stripe_deposit_session_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_remaining_session_id VARCHAR(255);
```

**Nota:** `deposit_amount` es el importe de la paga y señal. Si el admin no lo edita, se inicializa al 30% del `total_price` al crear la reserva. El admin puede modificarlo antes de aprobar.

### Nueva tabla `payment_tokens`

```sql
CREATE TABLE IF NOT EXISTS payment_tokens (
  id             SERIAL PRIMARY KEY,
  token          VARCHAR(64) UNIQUE NOT NULL,
  reservation_id VARCHAR(100) NOT NULL,
  token_type     VARCHAR(30) NOT NULL DEFAULT 'remaining_payment',
  expires_at     TIMESTAMP NOT NULL,   -- 72h desde creación
  used           BOOLEAN DEFAULT false,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_tokens_token ON payment_tokens(token);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_reservation ON payment_tokens(reservation_id);
```

---

## 2. Pago de la paga y señal con tarjeta

### Flujo

```
Step 3 (datos cliente) — usuario elige "Tarjeta"
  └─ submit → POST /api/webhook-reserva
       └─ n8n crea reserva con payment_status='pending_deposit'
       └─ devuelve { success, reservationId }
  └─ si paymentMethod === 'card':
       POST /api/create-checkout-session
         body: { reservationId, type: 'deposit', amount: depositAmount, ... }
       └─ devuelve { url }
       └─ window.location.href = url  (redirige a Stripe)

Stripe webhook checkout.session.completed (type=deposit)
  └─ UPDATE reservations SET
       deposit_paid = amount,
       payment_status = 'deposit_paid',
       stripe_deposit_session_id = session.id
  └─ POST n8n: event='deposit_paid'
  └─ redirect → /booking/success?session_id=xxx
```

### Cambios en `create-checkout-session.ts`

- Añadir parámetro `type: 'deposit' | 'remaining'` en metadata.
- Aceptar `reservationId` como parámetro (ya no se genera aquí).
- Si `type === 'deposit'`: usar `depositAmount` del body.

### Cambios en `Step3CustomerData.tsx`

- Tras recibir `reservationId` del webhook, si `paymentMethod === 'card'`:
  - Llamar a `/api/create-checkout-session` con el `depositAmount` calculado.
  - Redirigir a Stripe en lugar de avanzar al Step 4.
- Si `paymentMethod !== 'card'`: flujo sin cambios (avanza a Step 4).

### Cambios en `stripe-webhook.ts`

- En `checkout.session.completed`: leer `metadata.type`.
  - Si `'deposit'`: actualizar `deposit_paid`, `payment_status='deposit_paid'`.
  - Si `'remaining'`: actualizar `deposit_paid` (suma), `payment_status='fully_paid'`.

---

## 3. Pago del importe restante

### API unificada: `POST /api/payments/remaining`

Acepta dos modos:
- **Autenticado:** `{ reservationId }` — verifica que la reserva pertenece al usuario en sesión.
- **Token:** `{ token }` — valida token en `payment_tokens`, no requiere login.

Lógica:
1. Resuelve la reserva.
2. Calcula `remaining = total_price - deposit_paid`.
3. Verifica `remaining > 0` y `payment_status === 'deposit_paid'`.
4. Crea Stripe Checkout Session (`type: 'remaining'`, amount = remaining).
5. Guarda `stripe_remaining_session_id` en la reserva.
6. Devuelve `{ url }`.

### API: `POST /api/payments/token` (interna, llamada desde n8n)

- Recibe `{ reservationId }`.
- Crea entrada en `payment_tokens` con TTL de 72h.
- Devuelve `{ token, url: 'https://happyhub.es/pagar/{token}' }`.
- Protegida con `INTERNAL_API_SECRET` (header `x-internal-secret`).

### Nueva página: `/pagar/[token]`

Página pública. Muestra:
- Resumen del evento (fecha, tipo, invitados).
- Importe ya pagado y restante pendiente.
- Botón "Pagar {restante}€ con tarjeta".
- Si token caducado/usado: mensaje de error con teléfono de contacto.

### Área privada (`/area-privada`)

En cada tarjeta de reserva, si `payment_status === 'deposit_paid'`:
```
Paga y señal: {deposit_paid}€  ✅
Restante pendiente: {remaining}€
[Pagar ahora →]
```
El botón llama a `/api/payments/remaining` con `reservationId`.

### Panel admin (`/admin/reservations/[id]`)

Nueva sección "Pagos":
- Importe paga y señal (input editable, se guarda en `deposit_amount`).
- Estado del pago con badge.
- Botón **"Generar enlace de pago"** → llama a `/api/payments/token` → muestra URL copiable.

---

## 4. Recordatorios de pago (n8n)

### Workflow: `payment-reminder-cron`

**Trigger:** Schedule (cron) — diariamente a las 10:00h

**Lógica:**
```
1. Para cada días_antes IN [30, 7, 3]:
   a. Consulta DB:
      SELECT * FROM reservations
      WHERE payment_status = 'deposit_paid'
        AND status != 'cancelled'
        AND event_date = CURRENT_DATE + INTERVAL '{días_antes} days'

   b. Para cada reserva encontrada:
      i.  POST /api/payments/token → { token, url }
      ii. Envía email con:
          - Asunto según días_antes:
            * 30d: "Recuerda completar el pago de tu evento en HappyHub"
            * 7d:  "Faltan 7 días — completa el pago de tu reserva"
            * 3d:  "⚠️ Último aviso: 48h para completar el pago o perderás la reserva"
          - Importe pendiente
          - Enlace /pagar/{token}
          - Datos del evento
      iii. Notifica admin (email/WhatsApp resumen diario)
```

**Tono del email a 3 días:** explícito — si no se realiza el pago en las próximas 48 horas, la reserva quedará cancelada automáticamente y la fecha liberada.

**Nota:** la cancelación automática tras el ultimatum queda fuera del scope de este change (requiere workflow adicional). En esta fase, el ultimatum es informativo y la cancelación la gestiona el admin manualmente.

---

## 5. Borrado íntegro de evento de calendario

### Nueva API: `DELETE /api/admin/reservations/[id]/cancel-full`

Solo accesible para rol `admin`.

Lógica:
1. Obtiene la reserva; verifica que existe y no está ya cancelada.
2. Si `google_calendar_event_id` existe:
   - Llama Google Calendar API: `DELETE /calendars/primary/events/{eventId}`.
   - Si el evento ya no existe en Calendar (404), continúa sin error.
3. `UPDATE reservations SET status='cancelled', updated_at=NOW()`.
4. Notifica n8n: `event='reservation_cancelled_by_admin'` (para WhatsApp/email al cliente).
5. Devuelve `{ success: true }`.

### UI en `/admin/reservations/[id]`

- Botón "Cancelar y eliminar del calendario" (rojo, solo visible si `status !== 'cancelled'`).
- Modal de confirmación:
  > "¿Cancelar la reserva {reservationId}? Se eliminará el evento del Google Calendar y se notificará al cliente."
- Tras confirmar: redirige a `/admin/reservations` con toast de confirmación.

**Diferencia con "Rechazar":** rechazar solo cambia el estado. Este endpoint además elimina el evento del Google Calendar. Diseñado para reservas ya aprobadas (con evento en calendario).

---

## Archivos a crear / modificar

| Archivo | Acción |
|---|---|
| `src/lib/db.ts` | Añadir migraciones de columnas y tabla `payment_tokens` |
| `src/pages/api/create-checkout-session.ts` | Aceptar `reservationId` y `type`; no generar ID aquí |
| `src/pages/api/stripe-webhook.ts` | Manejar `type: deposit` y `type: remaining` |
| `src/pages/api/payments/remaining.ts` | Nuevo — pago restante autenticado o por token |
| `src/pages/api/payments/token.ts` | Nuevo — generar token de pago (interno) |
| `src/pages/pagar/[token].tsx` | Nuevo — página pública de pago por link |
| `src/components/booking/Step3CustomerData.tsx` | Redirigir a Stripe si card |
| `src/pages/area-privada.tsx` | Mostrar restante + botón de pago |
| `src/pages/admin/reservations/[id]/index.tsx` | Sección pagos + botón cancel-full |
| `src/pages/api/admin/reservations/[id]/cancel-full.ts` | Nuevo — borrado íntegro |
| `n8n/workflows/payment-reminder-cron.json` | Nuevo — workflow de recordatorios |

---

## Fuera de scope (para otro change)

- Cancelación automática tras ultimatum de 3 días (requiere workflow n8n adicional).
- Reembolsos automáticos por Stripe.
- Envío de factura al completar el pago total.
