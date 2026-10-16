## Decisions

1. **Dos Checkout Sessions seguidas** (resto con captura automática, fianza con captura manual) en vez de una: una sesión solo admite un método de captura, y autorizar resto+fianza juntos retrasaría cobrar el alquiler hasta la revisión (y se perdería todo si caduca). Con Apple/Google Pay son dos toques.
2. **Orden**: primero el resto, después la fianza. El enlace no se marca como usado hasta que ambos estén hechos.
3. **Caducidad del bloqueo**: se guarda `capture_before` del cargo de Stripe; si no viene, se asume 7 días (pago iniciado por el cliente). Datáfono: se registra con caducidad orientativa de 2 días.
4. **Acciones de fianza**: liberar = cancelar el PaymentIntent; cobrar daños = `capture` con `amount_to_capture` (Stripe libera automáticamente el resto). Datáfono: solo se registra el estado; la operación se hace en el terminal.
5. **Estados** `security_deposit_status`: none | held | released | captured | expired.
6. **Bizum**: la página de pago del resto/fianza solo ofrece tarjeta; la señal sigue admitiendo Bizum.
7. **QR**: generado en el navegador del admin con la librería `qrcode` (no se envía el enlace a servicios externos).
8. **Recordatorios**: `/api/payments/token` (solo lo usa n8n) devuelve 410 para cortar el flujo aunque el workflow siga activo.
9. Nombre del cliente sin cuenta: se toma de `contract_acceptances` en la página de pago y en el listado admin.
