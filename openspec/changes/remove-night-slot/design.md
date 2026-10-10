## Decisions

1. **Quitar la oferta, no el dato.** `night` sigue en el tipo y en las etiquetas de lectura para no romper reservas, bloqueos o facturas antiguas. Lo que desaparece es cualquier forma de elegirla.
2. **`BOOKABLE_TIME_SLOTS` + `isBookableTimeSlot`** en `utils/pricing.ts` como fuente única. Se usan en la API, en la preselección de `/reservas` y en el listado de franjas con precio.
3. **Validación en servidor**: aunque la UI ya no la ofrezca, `webhook-reserva` rechaza `night`, por si alguien envía la petición a mano o usa un enlace antiguo.
4. **El esquema admin acepta `night`** para poder editar una reserva antigua sin que falle la validación. El selector de admin ya no la ofrece.

## Risks / Trade-offs

- El calendario admin ya no tiene fila de noche: si existiera alguna reserva antigua de noche, no se vería ahí (sí en el listado de reservas).
- Los workflows de n8n no se tocan: no se les envía `night` porque la API lo rechaza antes.
