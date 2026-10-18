## Decisions

- **Mismo enlace**: `POST /payment-link` con `{ sendEmail: true }` crea el mismo token `remaining_payment` (72 h) que el QR y además envía el correo. Devuelve la URL, así el modal muestra también el QR y el enlace.
- **Destinatario**: email de la cuenta o, si no tiene, el de la aceptación de los términos (como el resto de avisos). Sin email → 400 con aviso para usar el QR.
- **Contenido**: paso 1 «pagar el resto» (solo si queda resto) y paso 2 «bloquear la fianza de 150 €», con lo que significa la fianza.
