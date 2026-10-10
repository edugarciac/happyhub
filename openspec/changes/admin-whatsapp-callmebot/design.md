## Decisions

1. **CallMeBot solo para el admin**: es un servicio no oficial pensado para mensajes al propio número, y encaja con los avisos internos. Para clientes se usará Meta Cloud API más adelante.
2. **Selección por variable de entorno**: con `CALLMEBOT_API_KEY` se usa CallMeBot; sin ella, Meta. Así no hay que cambiar código al migrar a Meta.
3. **Detección de errores**: CallMeBot devuelve HTML con 200 incluso en algunos errores, así que se considera fallo si la respuesta contiene `error`, `invalid` o `not allowed`.
4. **Timeout de 8 s** y nunca lanza: un fallo de WhatsApp no rompe la reserva (además, `webhook-reserva` ya limita la espera a 5 s).

## Risks / Trade-offs

- Servicio gratuito de terceros sin SLA: puede tener retrasos o caídas. El admin también recibe correo de cada reserva como respaldo.
- La API key de CallMeBot va en la URL (así funciona su API), pero la llamada es de servidor a servidor por HTTPS.
