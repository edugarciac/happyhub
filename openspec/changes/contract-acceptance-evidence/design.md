## Context

`reservations` no guarda nombre/email/teléfono (vienen de `users` si el cliente tiene cuenta), así que la prueba debe llevar su propia copia de la identidad declarada.

## Decisions

1. **Tabla propia sin FK a `reservations`**: la prueba debe sobrevivir al borrado o edición de la reserva. Se guarda `reservation_id` sin clave foránea.
2. **Inmutabilidad por trigger**: `DELETE` bloqueado; `UPDATE` solo permitido para rellenar `confirmation_email_sent_at` cuando es NULL.
3. **Qué texto se acepta**: el cliente envía el `innerText` del cuadro de términos que leyó; el servidor calcula el SHA-256 y guarda además `VERCEL_GIT_COMMIT_SHA`, que fija el código fuente público de esos términos. Doble anclaje: lo que vio y lo que estaba desplegado.
4. **Hash de la prueba**: SHA-256 del JSON canónico de todos los campos, para detectar alteraciones.
5. **Hora del servidor** (`TIMESTAMPTZ DEFAULT NOW()`), nunca la del navegador.
6. **IP**: primer valor de `x-forwarded-for` (Vercel), luego `x-real-ip`, luego el socket.
7. **Atomicidad práctica**: reserva y prueba se insertan en secuencia; si la prueba falla se borra la reserva y se devuelve 500. No hay reserva sin prueba.
8. **Validación**: texto de términos entre 1.000 y 200.000 caracteres; versión obligatoria.
9. **Extra de acceso anticipado**: se gestiona como servicio del catálogo (`service_catalog`) para que sume al precio en el flujo de reserva; las migraciones se aplican a mano en Neon, por lo que también puede crearse desde el panel de servicios.

## Risks / Trade-offs

- [Riesgo] Clientes con versiones cacheadas del frontend no envían el texto → la API devuelve 400 con mensaje para recargar. Aceptado: el despliegue es inmediato y la página de reserva no se cachea de forma agresiva.
- [Trade-off] ~10 KB por reserva por guardar el texto completo. Aceptado: volumen bajo.
