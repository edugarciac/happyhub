## Decisions

1. **Orden**: primero las fotos horizontales del espacio (lo que vende), y al final los baños. El baño adaptado con cambiador es un argumento para familias, así que se incluye.
2. **Fotos verticales**: el carrusel es 16:9 con `object-cover`, y una foto vertical perdería más de la mitad de la imagen. Con `portrait: true` se usa `object-contain` con una copia desenfocada de fondo, sin franjas negras.
3. **Nombres descriptivos** (`sala-principal.jpg`…) en lugar de `gallery-N.jpg`, para que sea más fácil mantenerlas.
4. **Metadatos eliminados** (`-strip`): las fotos de móvil pueden llevar coordenadas GPS.

## Non-Goals

- El vídeo de fondo del Hero y la ilustración de Mis Eventos no se tocan.
