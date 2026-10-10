## Decisions

1. **`await` + `Promise.race` con 5 s**: garantiza que el envío se intenta antes de que Vercel congele la función, sin bloquear la reserva si Meta tarda. Un fallo de WhatsApp nunca rompe la reserva.
2. **Log explícito** `Admin WhatsApp notification NOT sent` para detectarlo en los logs de Vercel.
3. **No se duplica el envío de correo en Next.js**: el correo es responsabilidad de n8n; primero hay que arreglar su configuración.
