## Why

La pantalla final de la reserva prometía cosas que no se cumplen:
- "Recibirás un WhatsApp con los detalles de tu reserva": al cliente no se le envía ningún WhatsApp (solo al admin, vía CallMeBot).
- "Nos pondremos en contacto contigo en las próximas 24 horas": el propietario prefiere no comprometerse a 24 h.

## What Changes

- `Step4Confirmation`: se quita la línea del WhatsApp y "24 horas" pasa a "en los próximos días".
- Correo de confirmación al cliente (`emailTemplates.ts`): "te contactaremos en los próximos días" (también en la variante de festivo).

## Fuera de alcance

Otros "24h" de la web (Hero "Respuesta en 24h", contacto, FAQ de cómo funciona, CTA de la portada) se dejan como están, pendientes de decisión del propietario.

## Impact

- `src/components/booking/Step4Confirmation.tsx`, `src/lib/emailTemplates.ts`
