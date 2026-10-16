## Why

Decisión del propietario (17/10/2026), modelo de cobro simplificado:
1. Señal del 30% al aprobar la reserva (tarjeta o Bizum) — sin cambios.
2. El día del evento, antes de empezar: cobro del resto + bloqueo (preautorización) de 150 € en la tarjeta del cliente, liberado tras revisar el local (como máximo 7 días).
3. El resto y la fianza no se pueden pagar con Bizum.
4. Preferente: enlace/QR que el cliente paga en su móvil (bloqueo válido 7 días). Alternativa: datáfono (bloqueo válido ~2 días Mastercard/Amex, ~5 Visa), gestionado fuera del sistema y registrado a mano.

Hoy la fianza (200 €) solo figura en el contrato impreso, no se cobra, y un recordatorio n8n amenaza con cancelar si no se paga el resto con antelación, en contra de las condiciones.

## What Changes

- Página `/pagar/[token]` en dos pasos: 1) pagar el resto con tarjeta, 2) bloquear 150 € (Stripe Checkout con `capture_method=manual`). El enlace sirve hasta completar ambos.
- Panel admin: modal "Cobro del día" con enlace + QR, estado del resto y de la fianza, y acciones: resto cobrado en datáfono, fianza bloqueada en datáfono, liberar fianza, cobrar daños (captura parcial ≤150 €).
- Webhook Stripe: registra el bloqueo (fecha de caducidad real de Stripe) y su caducidad/cancelación (`payment_intent.canceled`).
- Columnas nuevas en `reservations` para el estado de la fianza y el método de cobro del resto.
- Recordatorio n8n de pago anticipado desactivado (`/api/payments/token` responde 410).
- Textos: términos, contrato, PDF, FAQ, tabla de precios, emails y confirmación de reserva explican el modelo de forma clara (incluye débito vs crédito y Bizum solo para la señal). Fianza: 150 €.

## Capabilities

### Modified Capabilities
- `payments`: cobro del resto el día del evento y fianza por preautorización.

## Impact

BD (`028_security_deposit_hold.sql` + guard en tiempo de ejecución), APIs de pago y admin, webhook Stripe, página de pago, panel admin, textos legales y emails. Nueva dependencia `qrcode`. Requiere suscribir el webhook de Stripe a `payment_intent.canceled`.
