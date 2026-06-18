## Why

El dashboard de eventos colaborativos (`/mis-eventos/[id]`) tiene 9 secciones en el sidebar. La pestaña "Detalles" (🎀) muestra actualmente un placeholder "🚧 próximamente" sin ninguna funcionalidad. Es una de las 5 secciones pendientes identificadas (junto a Info, Servicios, Fotos, Mensajes) tras el bloque 1-2 del dashboard (`docs/superpowers/specs/2026-05-30-mis-eventos-dashboard-design.md`), que dejó explícitamente fuera del scope los bloques 3-10.

Esta sección cubre los "detalles" decorativos y logísticos del evento que no encajan en invitados, regalo o entretenimiento: decoración, detalles para invitados (favors), peticiones especiales (alergias, accesibilidad, etc.). El propio timeline ya referencia un hito tipo "Detalles invitados" con campos descripción/cantidad/responsable, que esta sección generaliza en un checklist persistente.

## What changes

- Nueva tabla `event_detail_items`: checklist de detalles del evento (título, categoría, descripción, cantidad, responsable, estado pendiente/hecho)
- Nuevos endpoints API CRUD bajo `/api/events/collaborative/[id]/detalles`
- Nuevo componente `DetailsSection.tsx` que sustituye el placeholder de la sección "Detalles"
- Cualquier participante puede añadir ítems; el organizador o quien lo añadió puede editarlo/eliminarlo; cualquier participante puede marcarlo como hecho/asignárselo

## Capabilities

### New capabilities
- `event-details-checklist`: checklist de detalles (decoración, favors, peticiones especiales) por evento colaborativo

## Impact

**Database:**
- `database/migrations/015_event_details_section.sql` — tabla `event_detail_items`

**API routes:**
- `src/pages/api/events/collaborative/[id]/detalles/index.ts` — GET lista, POST crear
- `src/pages/api/events/collaborative/[id]/detalles/[itemId].ts` — PATCH actualizar, DELETE eliminar

**UI components:**
- `src/components/events/DetailsSection.tsx` — nuevo
- `src/pages/mis-eventos/[id].tsx` — reemplaza `SectionPlaceholder` por `DetailsSection` en el case `'detalles'`

**No hay cambios en:**
- Resto de secciones del dashboard (Info, Servicios, Fotos, Mensajes siguen siendo placeholders, fuera de este scope)
