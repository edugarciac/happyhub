## Why

El menú lateral de "Mis Eventos" es difícil de leer (icono+texto de 9px apilados en 76px), incluye secciones sin terminar (Info, Mensajes, Servicios, Fotos) y esconde Música/Actividades como sub-tabs dentro de "Entretenimiento" cuando deberían ser accesibles directamente. Además, no hay forma de que un usuario cualquiera mande feedback sobre el sitio.

## What Changes

- **EventSidebar**: nueva lista de secciones de primer nivel — Timeline, Invitados, Regalo, Música, Actividades, Detalles. Se quitan Info y Mensajes; se ocultan Servicios y Fotos (código intacto, solo fuera del menú). Estilo icono+texto en fila horizontal (desktop); en móvil se convierte en barra inferior fija con los mismos iconos.
- **GiftFundCard**: se quita el botón "+ Crear colecta grupal" — si no hay colecta, no se muestra nada; colectas ya existentes se pueden seguir editando/viendo normal.
- **Feedback widget**: botón flotante discreto (esquina inferior izquierda, visible en todo el sitio salvo `/admin`), abre un formulario simple, guarda en tabla nueva `feedback`, envía WhatsApp al admin (reutilizando `sendAdminNotification` ya existente en `src/lib/whatsapp.ts`), y una vista de solo lectura en `/admin/feedback`.

## Capabilities

### New Capabilities
- `feedback-widget`: captura de feedback público con notificación WhatsApp y vista admin

### Modified Capabilities
- `event-sidebar`: navegación de "Mis Eventos" reestructurada y responsive

## Impact

- **DB**: nueva tabla `feedback` (migración `database/migrations/015_create_feedback_table.sql`)
- **Frontend**: `EventSidebar.tsx`, `GiftFundCard.tsx`, `src/pages/mis-eventos/[id].tsx` (rutas de sección), nuevo `FeedbackWidget.tsx` montado en `_app.tsx`, nueva página `src/pages/admin/feedback.tsx`
- **Backend**: nuevo `src/pages/api/feedback.ts` (POST público) y `src/pages/api/admin/feedback.ts` (GET protegido)
