## Why

El paso 3 de la reserva mostraba un resumen de cinco puntos que no coincidía con la página `/terminos` y confundía. Además, la página completa no recogía todos los puntos del resumen y describía un proceso de reserva y unos medios de pago ya obsoletos. El propietario quiere que el cliente **lea los términos completos antes de aceptar**.

## What Changes

- Nuevo componente `TermsContent` con el texto completo. Lo usan `/terminos` y el paso 3, así ambos muestran exactamente el mismo texto.
- `/terminos` incorpora lo que faltaba:
  - **Proceso de reserva** actualizado: solicitud sin cargo → pendiente de aprobación → correo con enlace de pago (tarjeta) o instrucciones de Bizum → 24 h para pagar el depósito o cancelación automática → confirmación.
  - **Medios de pago**: tarjeta (Stripe) o Bizum. Se elimina "transferencia".
  - **Cambio de fecha** gratuito hasta 30 días antes, sujeto a disponibilidad.
  - Fecha de última actualización: 10 de octubre de 2026.
- Paso 3: el resumen se sustituye por los **términos completos en un recuadro con scroll**. La casilla "He leído y acepto" está **desactivada hasta llegar al final** del texto, y hay un enlace para abrirlos en otra pestaña.

## Impact

- `src/components/TermsContent.tsx` (nuevo), `src/pages/terminos.tsx`, `src/components/booking/Step3CustomerData.tsx`.
