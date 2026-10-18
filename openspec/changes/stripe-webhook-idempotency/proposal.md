## Why

El destino del webhook en Stripe apuntaba a `https://happyhub.es/api/stripe-webhook`, que Vercel redirige (307) a `www`. Stripe no sigue redirecciones, así que ningún pago con tarjeta se registraba. Al corregir la URL, Stripe entrega los eventos pendientes con sus reintentos y el admin puede reenviarlos a mano: un mismo pago puede llegar varias veces y, hoy, cada entrega repite el correo de confirmación y los WhatsApp.

## What Changes

- El webhook ignora un `checkout.session.completed` de señal o de resto cuya sesión ya está registrada en la reserva (`stripe_deposit_session_id` / `stripe_remaining_session_id`).
- La fianza y los cobros adicionales ya eran idempotentes.
- Configuración en Stripe (fuera del código): URL `https://www.happyhub.es/api/stripe-webhook` y eventos `checkout.session.completed`, `payment_intent.payment_failed`, `payment_intent.canceled`.

## Impact

- `src/pages/api/stripe-webhook.ts`
