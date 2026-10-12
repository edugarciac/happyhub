## Decisiones

- **Mantener `/favicon.png` como URL** y regenerar su contenido, en vez de apuntar a otro fichero: navegadores y bookmarks ya lo tienen cacheado por esa ruta.
- **Lienzo cuadrado**: `happyhub_logo_cara.png` es 513×448; un favicon/apple-touch-icon no cuadrado se deforma. Se escala a lo ancho y se centra en 512×512 RGBA transparente.
- **og:image → `happyhub_logo_white.png`**: es el logo completo (carita + texto) con guiño, 1024×1024. Eliminar `favicon.jpeg` evita que vuelva a usarse por error.
- **Borrar en vez de reemplazar** los ficheros no referenciados: menos assets = menos riesgo de que reaparezca el logo antiguo.

## Riesgos

- Previews de WhatsApp/redes cacheadas pueden seguir mostrando el logo antiguo hasta que expire su caché (fuera de nuestro control).
