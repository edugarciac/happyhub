## Why

La funcionalidad de eventos colaborativos existe en HappyHub pero está enterrada en el área privada, invisible para visitantes no registrados. Es el diferenciador de producto más potente de la plataforma y debe tener visibilidad de primer nivel.

Además, la promesa de valor del producto es amplia y rica (timeline, invitados, regalo coordinado, WhatsApp, servicios adicionales...) y actualmente no existe ninguna página que la comunique. El resultado es que usuarios potenciales llegan a HappyHub, ven una plataforma de reservas de espacio, y no descubren la capa colaborativa.

## What changes

- Nuevo ítem "Mis Eventos" en el menú de navegación principal, visible para todos los usuarios
- Nueva página `/mis-eventos` con landing de producto que explica la propuesta de valor completa
- La landing actúa como canal de captación: CTA a login/registro para empezar
- Para usuarios con sesión activa: redirect automático a `/area-privada`
- No se crea backend nuevo — es frontend puro sobre funcionalidad ya existente

## Capabilities

### New capabilities
- `mis-eventos-landing`: Página de marketing con pitch completo de la plataforma de eventos colaborativos
- `mis-eventos-nav`: Acceso desde el menú principal sin requerir sesión previa

### Modified capabilities
- `header-nav`: Añade ítem "Mis Eventos" visible para todos los visitantes

## Impact

**UI pages:**
- `/mis-eventos` — nueva landing page de producto

**UI components:**
- `Header.tsx` — añadir ítem de navegación

**No hay cambios en:**
- Base de datos
- API routes
- Área privada
- Flujo de login existente
