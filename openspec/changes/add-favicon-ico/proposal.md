## Why

El sitio solo servía el favicon como PNG (`public/favicon.png`, referenciado con `type="image/png"`). Muchos navegadores y agentes (crawlers, pestañas antiguas, bookmarks) siguen pidiendo `/favicon.ico` por defecto aunque no haya `<link>` explícito; sin un `.ico` real, esa petición cae en 404. El usuario pidió subir el logo en formato `.ico` a la web.

## What Changes

- Generar `public/favicon.ico` (multi-resolución: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256) a partir del logo ya usado como favicon (`public/favicon.png`, la carita sonriente de HappyHub)
- Añadir `<link rel="icon" href="/favicon.ico" sizes="any">` y `<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">` en `src/pages/_document.tsx`, manteniendo el PNG como fallback adicional (`type="image/png"`) y el `apple-touch-icon` sin cambios

## Capabilities

### Added Capabilities

- `favicon-ico`: El sitio debe servir un favicon `.ico` válido en `/favicon.ico`, además del PNG existente

## Impact

- **Assets estáticos**: nuevo `public/favicon.ico`
- **Frontend**: `src/pages/_document.tsx` — solo las etiquetas `<link>` de favicon
- No hay cambios de backend, DB ni APIs
