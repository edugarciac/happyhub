## Context

No había herramienta de conversión de imágenes disponible en el entorno (sin ImageMagick, sin `sharp` como dependencia del proyecto). Se instaló `Pillow` (`pip3 install Pillow`) para leer el PNG existente y exportarlo como `.ico` multi-resolución.

## Decisions

1. **Fuente**: se parte de `public/favicon.png` (ya es el logo correcto — la carita sonriente con destello — y ya se usaba como favicon), no de otros assets del logo, para no introducir una imagen distinta a la que el sitio ya mostraba.
2. **Tamaños**: se incluyen 16, 32, 48, 64, 128 y 256 px en un único `.ico`, el rango estándar para que Windows/navegadores elijan la resolución adecuada según el contexto (pestaña, favoritos, acceso directo).
3. **Etiquetas HTML**: se añade el `.ico` como icono principal (`sizes="any"`, que es lo que recomienda la convención actual para favicons multi-formato) y se mantiene el `<link>` PNG existente como segunda opción, en vez de eliminarlo, para no romper ningún caso donde el PNG diera mejor resultado.

## Risks / Trade-offs

- [Riesgo] `Pillow` no viene con el proyecto (se instaló solo en el entorno de la sesión, no como dependencia npm) → Aceptado: la generación del `.ico` es un paso único, el artefacto resultante (`public/favicon.ico`) se versiona en git y no requiere Pillow en build/runtime.
