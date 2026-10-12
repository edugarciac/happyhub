## Why

Tras `update-logo-winking-face` siguen en el repo varios assets con la carita antigua (dos ojos abiertos, estrella sólida, puntos coral). El más visible es el **favicon** (`/favicon.png`, pestaña del navegador y apple-touch-icon) y la imagen **Open Graph** (`/favicon.jpeg`, preview al compartir el enlace en WhatsApp/redes). El usuario pidió erradicar todos los logos sin guiño y sustituirlos por la versión buena.

## What Changes

- **Favicon**: regenerar `public/favicon.png` a partir de `public/happyhub_logo_cara.png` (carita con guiño), centrado en un lienzo cuadrado 512×512 transparente. Mismo nombre de fichero → `_document.tsx` no cambia para los iconos.
- **Open Graph**: `og:image` pasa de `/favicon.jpeg` a `/happyhub_logo_white.png` (logo completo con guiño sobre fondo blanco).
- **Eliminar** assets sin guiño (ninguno referenciado salvo los dos anteriores):
  - `public/favicon.jpeg`, `public/favicon2.jpeg`
  - `public/happyhub_logo_white.jpg` (sustituido por `happyhub_logo_white.png`)
  - `public/logo-happyhub-white.jpeg`, `public/logo-happyhub-white-small.jpeg` (este último es un PNG con extensión `.jpeg`)
  - `src/logo/logo-happyhub-white.jpeg`, `src/logo/logo-happyhub-black.jpeg` (carpeta `src/logo/` sin usos)
- **Eliminar duplicados** `_old` (byte a byte idénticos a la versión actual con guiño): `public/happyhub_logo_white_old.png`, `public/logo-happyhub-black_old.jpeg`.

## Out of Scope

- Fotos/renders con el logo integrado (`Happyhub-coming2026.jpeg`, `happyhub_home.png`, `images/*`): ya muestran el guiño.
- `HappyHub_logo.ico`: ya tiene guiño.

## Impact

- `src/pages/_document.tsx`: una línea (`og:image`).
- Assets en `public/` y `src/logo/`. URLs eliminadas no están referenciadas en código, n8n ni docs.

## Ampliación: nombre con «H» mayúscula (HappyHub)

La marca se escribe **HappyHub** (segunda H mayúscula). Se eliminan también los assets con «Happyhub»:
- `public/logo-happyhub-black.jpeg` (sustituido por `public/logo-happyhub-black.png`, que dice HappyHub). Sin referencias.
- `public/happyhub_home.png` (render con neón «Happyhub»). Sin referencias.

Pendiente de decisión del usuario: `public/happyhub_coming.mp4` (vídeo de fondo del Hero) y su póster `public/Happyhub-coming2026.jpeg` muestran «Happyhub» y están en uso.
