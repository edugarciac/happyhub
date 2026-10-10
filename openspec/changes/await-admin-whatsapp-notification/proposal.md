## Why

En la primera reserva real de prueba (2026-10-10 08:49 UTC) la reserva se guardó como pendiente, pero no llegó ni el WhatsApp ni el correo. Los logs de Vercel muestran:

- `Admin WhatsApp number not configured`: falta `ADMIN_WHATSAPP_NUMBER` en Vercel (configuración, no código).
- `Respuesta de n8n: { message: 'Workflow was started' }`: el workflow de n8n en producción responde nada más empezar, así que la web no se entera de si los correos (nodos Gmail de n8n) fallan después.

Además, `webhook-reserva` lanzaba el WhatsApp al admin sin esperarlo (`.catch()` sin `await`). En Vercel la función se congela al enviar la respuesta, así que aunque la variable estuviera configurada el mensaje podía perderse.

## What Changes

- `webhook-reserva`: el aviso de WhatsApp al admin se espera (`await`) con un tope de 5 s antes de responder, y se registra en el log si no se envía.

## Fuera de alcance (acciones del propietario)

- Añadir `ADMIN_WHATSAPP_NUMBER` en Vercel (y comprobar `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN`).
- Revisar en n8n la ejecución de esa reserva: credenciales de Gmail/Google Calendar y el modo de respuesta del Webhook (debería ser "Using 'Respond to Webhook' node", como en el JSON del repo).

## Impact

- `src/pages/api/webhook-reserva.ts`. La respuesta al cliente puede tardar hasta 5 s más en el peor caso.
