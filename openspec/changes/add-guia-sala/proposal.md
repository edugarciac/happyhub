## Why

Los clientes de HappyHub no saben cómo usar el panel de la sala (luces, aire, música, Bluetooth) y acaban llamando o el propietario tiene que intervenir desde su móvil. Las normas del espacio ya están publicadas en `/como-funciona`, pero no hay una guía de uso de la sala ni forma de consultarla desde la tablet del panel de Home Assistant.

## What Changes

- Nueva página pública `/guia-sala` con la guía de uso de la sala: panel, luces, aire, música/Bluetooth, gramola y ayuda, más las preguntas de "El día de tu evento", "Decoración y limpieza" y "Normas del espacio".
- Buscador sin acentos y filtro por categorías para encontrar respuestas rápido.
- Variante `/guia-sala/panel` sin cabecera, pie ni avisos, pensada para incrustarse en el panel de Home Assistant de la tablet.
- Las preguntas frecuentes de `/como-funciona` pasan a un módulo de datos compartido (`src/data/faqs.ts`) para no duplicar texto.
- `next.config.js`: `/guia-sala/panel` se puede incrustar desde cualquier origen (`frame-ancestors *`, sin `X-Frame-Options`); el resto del sitio mantiene `SAMEORIGIN`.
- Enlace a la guía desde `/como-funciona`.

## Capabilities

### New Capabilities
- `guia-sala`: guía de uso de la sala consultable y buscable en la web y desde el panel de la tablet.

### Modified Capabilities
- `security-headers`: excepción de framing solo para `/guia-sala/panel`.

## Impact

- **Código**: `src/data/faqs.ts`, `src/data/guiaSala.ts`, `src/components/GuiaSala.tsx`, `src/pages/guia-sala/*`, `src/pages/como-funciona.tsx`, `src/pages/_app.tsx`, `src/components/CookieConsent.tsx`, `next.config.js`.
- **Seguridad**: `/guia-sala/panel` es contenido estático de solo lectura sin acciones ni sesión, por lo que permitir su incrustación no abre riesgo de clickjacking.
- **Home Assistant**: subvista "Ayuda" con una tarjeta iframe a `https://www.happyhub.es/guia-sala/panel`.
