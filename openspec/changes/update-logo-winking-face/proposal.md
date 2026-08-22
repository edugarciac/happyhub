## Why

El diseño oficial del logo de HappyHub (`04_Marketing_y_Web/Logo/HAPPY HUB DISEÑO.pdf` en Drive) muestra la carita del logo guiñando un ojo, con un único punto pequeño junto a la estrella. Los assets desplegados en `public/` (usados en el header y footer del sitio) tenían la versión antigua: dos ojos normales (dos puntos) y dos puntos junto a la estrella. El usuario pidió alinear los assets con el diseño oficial.

## What Changes

- Redibujar el ojo derecho como un guiño (arco curvado hacia arriba) manteniendo el ojo izquierdo como estaba, en los 4 assets que usan este diseño:
  - `public/logo-happyhub-black.jpeg` (fondo oscuro)
  - `public/happyhub_logo_white.png` (fondo blanco)
  - `public/happyhub_logo-removebg-preview.png` (fondo transparente)
  - `public/happyhub_logo_cara.png` (icono usado en `Header.tsx` — no estaba entre los ficheros que el usuario adjuntó inicialmente, pero es el logo real visible en la navbar del sitio, así que se incluye para consistencia)
- Sustituir la estrella sólida por una estrella con contorno turquesa y relleno blanco, y dejar siempre **dos** puntos turquesa junto a la estrella (no uno ni dos puntos de otro color), en los 4 assets — incluido `logo-happyhub-black.jpeg`, que originalmente tenía estrella blanca sólida + un solo punto rojo

## Out of Scope

- `public/happyhub_logo-trans.png`: no está referenciado en el código (`grep` no encuentra usos), y además el fichero NO es realmente transparente pese al nombre (es RGB con un patrón de cuadros a cuadros de fondo "quemado" en los píxeles) — asset obsoleto/mal exportado, no se toca
- Cambios de texto, tipografía o colores del logo — solo se toca la forma de los ojos y el número de puntos

## Impact

- **Assets estáticos**: los 4 ficheros PNG/JPEG listados arriba en `public/`
- No hay cambios de código; `Header.tsx` y `Footer.tsx` siguen referenciando los mismos nombres de fichero
