## Why

Después de reservar, el cliente a veces pide más horas, servicios, el día completo u otros extras. Hoy no hay forma de cobrárselos online: no se puede generar un enlace de pago con un concepto y un importe.

## What Changes

- Desde el listado de reservas del admin, botón «Cobros adicionales» por reserva: lista los cobros y permite crear uno nuevo.
- Conceptos: **extensión de horario** (1, 2 o 3 h; importe sugerido 60 €/h), **servicios adicionales** (del catálogo; importe sugerido la suma), **día completo**, **otros** (descripción obligatoria). El importe siempre se puede ajustar.
- Al crear el cobro se genera un enlace de pago con tarjeta (Stripe) y se envía al email de la reserva con la misma plantilla que el resto de correos de reserva (nº de reserva, fecha, concepto, importe y botón de pago).
- Página pública `/pagar/cargo/[token]` con el resumen y el botón de pago.
- El webhook de Stripe marca el cobro como pagado y envía la confirmación al cliente y al admin.
- El admin puede copiar el enlace, marcar un cobro como pagado a mano (Bizum/efectivo) o anularlo.
- Los cobros adicionales **no cambian** el precio total ni el resto del día del evento.

## Impact

- Nueva tabla `reservation_charges` (migración 033 + runtime)
- Nuevos: `src/utils/charges.ts`, `src/lib/reservationCharges.ts`, `src/pages/api/admin/reservations/[id]/charges.ts`, `src/pages/api/payments/charge.ts`, `src/pages/pagar/cargo/[token].tsx`, `src/components/admin/ReservationChargesModal.tsx`
- `src/lib/emailTemplates.ts`, `src/pages/api/stripe-webhook.ts`, `src/pages/admin/reservations/index.tsx`
