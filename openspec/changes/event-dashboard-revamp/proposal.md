## Why

El panel del evento (`/mis-eventos/[id]`) tiene una sección "Info" sin uso real y una sección "Detalles" que es solo un placeholder. Además, la barra lateral de navegación del evento es visualmente pobre (iconos emoji pequeños, sin agrupación) y no comunica bien las secciones disponibles. Se pide ocultar "Info", convertir "Detalles" en una sección funcional de "Recordatorios", y rediseñar la barra lateral.

## What changes

- Ocultar la sección "Info" del sidebar y del router de secciones (no se borra el código del placeholder, simplemente deja de ser navegable).
- Renombrar "Detalles" → "Recordatorios" y construir la funcionalidad real: lista de recordatorios con título, notas, fecha límite, asignación a un participante y estado completado/pendiente.
- Rediseñar `EventSidebar`: barra más ancha con iconos Lucide, etiqueta visible siempre, agrupación visual y estado activo más claro.

## Impact

- Afectados: `src/components/events/EventSidebar.tsx`, `src/pages/mis-eventos/[id].tsx`
- Nuevo componente: `src/components/events/RemindersSection.tsx`
- Nueva tabla: `event_reminders` (ver `database/migrations/015_reminders_and_photos.sql`)
- Nuevos endpoints: `GET/POST /api/events/collaborative/[id]/reminders`, `PATCH/DELETE /api/events/collaborative/[id]/reminders/[reminderId]`
