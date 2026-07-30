## Context

Los 4 assets son PNG/JPEG rasterizados sin fuente vectorial (no hay `.svg` ni `.ai`/`.fig` en el repo ni en la carpeta `04_Marketing_y_Web/Logo/` de Drive, solo JPEGs/PNGs y el PDF de referencia `HAPPY HUB DISEÑO.pdf`). No había herramienta de edición de imágenes disponible en el entorno, así que se instalaron `pillow`, `numpy` y `pymupdf` (`pip3 install --user ...`) para poder editar píxeles y renderizar el PDF de referencia a alta resolución (`fitz`, matrix 6x).

## Approach (versión final, tras corrección)

Una primera pasada guiñó el ojo equivocado (izquierdo) con la curva orientada al revés (valle en vez de arco), y no se detectó que la estrella de referencia lleva contorno turquesa + relleno blanco con **dos** puntos turquesa (no un punto sólido de color). Se corrigió releyendo el PDF a alta resolución (`pymupdf`, 6x zoom) y remuestreando colores/posiciones exactos con detección de componentes conexas por color.

1. **Restauración**: los 3 assets versionados en git (`logo-happyhub-black.jpeg`, `happyhub_logo_white.png`, `happyhub_logo_cara.png`) se restauraron a su estado original con `git checkout` antes de reintentar. `happyhub_logo-removebg-preview.png` no estaba versionado y se sobrescribió sin backup en el primer intento; se reconstruyó a partir de `happyhub_logo_white.png` quitando el fondo blanco por color-key y recortando al contenido (numpy).
2. **Ojo**: se detectan ambos ojos por color; se borra el ojo **derecho** (relleno con el color de la cara) y se redibuja como un arco relleno grueso que se curva hacia arriba (pico en el centro, extremos más bajos — no un valle) mediante un polígono generado a partir de un arco (no `ImageDraw.arc` directamente, dejaba trazo punteado). El ojo izquierdo no se toca.
3. **Estrella**: se sustituye la estrella sólida original por un "sparkle" de 4 puntas con contorno turquesa (`#09B1D2`) y relleno blanco, generado con una curva polar suave `r(θ) = rmin + (R-rmin)·((1+cos 4θ)/2)^power` (evita picos/aristas del `cos(2θ)^power` simple) ajustada visualmente contra el PDF de referencia.
4. **Puntos**: se borran los puntos/estrella antiguos y se dibujan **dos** puntos turquesa sólidos, posicionados con proporciones relativas al centro/radio de la estrella derivadas de las coordenadas exactas medidas en el PDF de referencia (no coordenadas fijas por asset).
5. **Borrado robusto**: el borrado de la región antigua de estrella/puntos se hace por "keep-mask" (se conserva todo pixel que sea amarillo de cara o ya-fondo, se borra el resto) en vez de por rango de color a eliminar — evita halos residuales de antialiasing. El borrado de estrella/puntos se ejecuta **antes** de dibujar el ojo (no después), para que el redibujado del ojo nunca quede recortado por un borrado posterior que se solape con su bounding box.
6. Todo se renderiza a 4x super-resolución y se reescala hacia abajo para suavizar bordes (no hay acceso a un renderer vectorial con antialiasing nativo).
7. Verificado visualmente a alta resolución (zooms) tras cada iteración, y en navegador real (`npm run dev`) en header (`happyhub_logo_cara.png`) y footer (`happyhub_logo_white.png`).

## Risks / Trade-offs

- [Riesgo] Edición por composición de píxeles en vez de partir de un vector fuente → el resultado depende de la detección automática de coordenadas y de la lectura visual del PDF de referencia; verificado a alta resolución antes de sustituir cada fichero en `public/`.
- [Riesgo] No existe fuente vectorial del logo en el repo/Drive → si en el futuro se necesita volver a editar el logo, se recomienda pedir al diseñador el `.ai`/`.fig`/`.svg` original en vez de repetir este proceso de edición de raster.
- [Lección] `happyhub_logo-removebg-preview.png` no estaba versionado en git; se perdió el original al sobrescribirlo en el primer intento fallido y hubo que reconstruirlo desde otro asset. Para cambios futuros en assets no versionados, copiar primero una copia de seguridad fuera de `public/` antes de editar.
