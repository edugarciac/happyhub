## Why

El tab "Timeline" de "Mis Eventos" se va a rehacer más adelante y de momento genera confusión mostrado a medias — se oculta de la navegación sin borrar código. El tab "Detalles" es un placeholder vacío ("próximamente") y hoy es donde HappyHub quiere ofrecer objetos personalizados (gorras, tazas, camisetas...) para los asistentes: el organizador necesita explicar su idea, dar dos textos cortos para los recordatorios del evento, un campo largo interno para que el equipo de HappyHub prepare los objetos, subir un par de fotos de referencia, y ver ideas preconcebidas como inspiración.

## What Changes

- **EventSidebar**: se retira la entrada "Timeline" de la navegación (desktop e igual en móvil, mismo array `SECTIONS`) sin tocar `EventTimeline.tsx` ni sus rutas API — solo deja de ser accesible desde el menú. El fallback de sección por defecto (`?section=` ausente) pasa de `'timeline'` a `'invitados'`.
- **EventSidebar**: la entrada "Detalles" se renombra a "Detalles personalizados" (mismo `id: 'detalles'`, mismo icono/color).
- **Nuevo tab "Detalles personalizados"**: sustituye el `SectionPlaceholder` actual por un componente real `CustomDetailsTab` con:
  - Texto explicativo invitando a describir la idea para crear objetos personalizados e inolvidables para los asistentes.
  - Dos campos de texto cortos (máx. 25 y 40 caracteres) pensados para aparecer en los recordatorios del evento (WhatsApp).
  - Un campo de texto grande, **solo interno** (uso exclusivo del equipo HappyHub, nunca se muestra a invitados ni en recordatorios), donde el organizador detalla lo que quiere.
  - Subida de hasta 2 imágenes de referencia, reutilizando el patrón `ImageUpload` + `/api/upload`.
  - Galería estática de ideas preconcebidas por HappyHub (gorras, chapas, tazas, bolsos, vasos, camisetas, bolsitas neceser, peluches, botellas de agua, etc.) a modo de inspiración, con espacio reservado para foto futura de cada idea (de momento solo icono/placeholder).
- **Backend**: nueva tabla `event_custom_details` (una fila por evento) y rutas API `GET`/`PUT` bajo `src/pages/api/events/collaborative/[id]/detalles/` siguiendo el patrón de autenticación de `regalo`/`entertainment`. El catálogo de ideas preconcebidas se define como datos estáticos en código (contenido curado por HappyHub, no editable por el usuario) — no requiere tabla propia.
- **Upload**: se añade `'custom-details'` a la whitelist de carpetas de `src/pages/api/upload.ts`.

## Capabilities

### New Capabilities
- `custom-details-tab`: formulario de detalles personalizados del evento (textos para recordatorios, notas internas, imágenes de referencia, galería de inspiración)

### Modified Capabilities
- `event-sidebar`: se oculta Timeline de la navegación y se renombra Detalles a "Detalles personalizados"

## Impact

- **DB**: nueva tabla `event_custom_details` (migración `database/migrations/022_custom_details_section.sql`)
- **Frontend**: `EventSidebar.tsx` (quitar entrada Timeline, renombrar label Detalles), `src/pages/mis-eventos/[id].tsx` (fallback de sección por defecto, nuevo `case 'detalles'`), nuevo `src/components/events/CustomDetailsTab.tsx`, nuevo `src/data/customDetailIdeas.ts` (catálogo estático de ideas)
- **Backend**: nuevas rutas `src/pages/api/events/collaborative/[id]/detalles/index.ts` (GET/PUT), whitelist de `src/pages/api/upload.ts` ampliada con `'custom-details'`
- Sin impacto en `EventTimeline.tsx` ni en sus rutas API — quedan intactas pero sin enlace de navegación
