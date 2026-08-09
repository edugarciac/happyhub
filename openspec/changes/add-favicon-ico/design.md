## Context

No había herramienta de conversión de imágenes disponible en el entorno (sin ImageMagick, sin `sharp` como dependencia del proyecto). Se instaló `Pillow` (`pip3 install Pillow`) para leer el PNG existente y exportarlo como `.ico` multi-resolución como primera versión.

Tras esa primera versión, el usuario subió directamente a `main` un `.ico` oficial (`public/HappyHub_logo.ico`, 7 tamaños: 16 a 256px, con el diseño de la carita guiñando un ojo). Se hizo merge de `main` en esta rama y `public/favicon.ico` se sustituyó por una copia de ese fichero oficial, descartando la versión generada a partir de `favicon.png`.

## Decisions

1. **Fuente final**: `public/HappyHub_logo.ico`, subido directamente por el usuario a `main` — es la fuente autorizada, no el `.ico` generado automáticamente en la primera pasada.
2. **`public/favicon.ico` como copia**: se mantiene `public/favicon.ico` (referenciado desde `_document.tsx` y es la ruta que los navegadores piden por defecto) como copia binaria idéntica de `public/HappyHub_logo.ico`, en vez de apuntar `_document.tsx` directamente al nombre `HappyHub_logo.ico`, para no depender de un nombre de fichero no convencional en la ruta por defecto del navegador.
3. **Etiquetas HTML**: se añade el `.ico` como icono principal (`sizes="any"`, recomendado para favicons multi-formato) y se mantiene el `<link>` PNG existente como segunda opción.

## Risks / Trade-offs

- [Riesgo] Dos ficheros `.ico` binarios idénticos versionados (`favicon.ico` y `HappyHub_logo.ico`) → Aceptado: `HappyHub_logo.ico` es el original subido por el usuario y se conserva tal cual; `favicon.ico` es la copia que sirve la convención `/favicon.ico`. Si el logo se actualiza en el futuro, hay que recordar sincronizar ambos.
