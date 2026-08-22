# Tasks: detalles-personalizados-section

## T1 — Ocultar Timeline y renombrar Detalles en el sidebar

**Archivo**: `src/components/events/EventSidebar.tsx`

- Quitar (no borrar el componente, solo la entrada) `{ id: 'timeline', label: 'Timeline', icon: Clock, color: 'primary' }` del array `SECTIONS`
- Cambiar `{ id: 'detalles', label: 'Detalles', ... }` a `label: 'Detalles personalizados'`
- Verificar que el import de `Clock` deja de usarse solo si no lo usa nada más en el fichero (si no, quitar el import no usado)
- Confirmar que desktop rail y bottom bar móvil reflejan ambos cambios (mismo array)

## T2 — Cambiar sección por defecto

**Archivo**: `src/pages/mis-eventos/[id].tsx`

- Cambiar `const section = (context.query.section as string) || 'timeline';` a `|| 'invitados'`
- Dejar intacto el `case 'timeline'` dentro de `renderSection()` y el import de `EventTimeline` (no se borra código, solo se deja de enlazar)

## T3 — Migración de base de datos

**Archivo**: `database/migrations/022_custom_details_section.sql`

- Crear tabla `event_custom_details`:
  - `id SERIAL PRIMARY KEY`
  - `event_id INTEGER NOT NULL UNIQUE REFERENCES collaborative_events(id) ON DELETE CASCADE`
  - `reminder_text_short VARCHAR(25)`
  - `reminder_text_medium VARCHAR(40)`
  - `internal_notes TEXT` — comentario SQL indicando "solo visible para el organizador vía API autenticada, nunca exponer en flujos públicos/recordatorios"
  - `image_url_1 VARCHAR(500)`
  - `image_url_2 VARCHAR(500)`
  - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
  - `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `CREATE INDEX IF NOT EXISTS idx_custom_details_event ON event_custom_details(event_id);`
- Seguir el estilo de `database/migrations/013_regalo_section.sql` (mismo `ON DELETE CASCADE`, mismo estilo de índice)

## T4 — Catálogo estático de ideas preconcebidas

**Archivo**: `src/data/customDetailIdeas.ts` (nuevo)

- Exportar `interface CustomDetailIdea { id: string; label: string; icon: LucideIcon; photoUrl?: string }`
- Exportar array `CUSTOM_DETAIL_IDEAS` con: gorras, chapas, tazas, bolsos, vasos, camisetas, bolsitas neceser, peluches, botellas de agua (usar iconos de `lucide-react` razonables para cada uno; `photoUrl` queda `undefined` por ahora)

## T5 — Endpoint API GET/PUT

**Archivo**: `src/pages/api/events/collaborative/[id]/detalles/index.ts` (nuevo)

- Usar `withCollaborativeEventAuth` (mismo patrón que `regalo/index.ts`)
- `GET`: `SELECT * FROM event_custom_details WHERE event_id = $1`, devolver `null` si no existe fila aún
- `PUT`:
  - Comprobar `ctx.isOrganizer`; si no, `403`
  - Validar `reminder_text_short.length <= 25` y `reminder_text_medium.length <= 40`; si se excede, `400`
  - `INSERT INTO event_custom_details (...) VALUES (...) ON CONFLICT (event_id) DO UPDATE SET ..., updated_at = CURRENT_TIMESTAMP`
  - Devolver la fila guardada

## T6 — Ampliar whitelist de carpetas de subida

**Archivo**: `src/pages/api/upload.ts`

- Añadir `'custom-details'` al array `allowedFolders` (línea ~39)

## T7 — Componente CustomDetailsTab

**Archivo**: `src/components/events/CustomDetailsTab.tsx` (nuevo)

- Props: `{ eventId: number; isOrganizer: boolean }`
- Cargar datos existentes con `GET` al montar
- Texto introductorio (copy en español, ver `proposal.md`)
- Dos `<input>` controlados con `maxLength={25}` y `maxLength={40}` respectivamente, con contador de caracteres visible
- `<textarea>` grande para notas internas, con etiqueta que aclare "solo uso interno de HappyHub, no se muestra a tus invitados"
- Dos `<ImageUpload>` (reutilizar `src/components/admin/ImageUpload.tsx`) con `folder="custom-details"`
- Galería de `CUSTOM_DETAIL_IDEAS` (grid de cards: icono o `photoUrl`, `label`)
- Botón guardar → `PUT` al endpoint de T5; estado de guardado/error visible
- Si `isOrganizer` es `false`, mostrar los campos en solo lectura (o mensaje de que solo el organizador puede editar) — la galería de ideas sigue siendo visible para todos los participantes

## T8 — Enlazar el tab en la página del dashboard

**Archivo**: `src/pages/mis-eventos/[id].tsx`

- Sustituir `case 'detalles': return <SectionPlaceholder label="Detalles" />;` por `case 'detalles': return <CustomDetailsTab eventId={event.id} isOrganizer={isOrganizer} />;`
- Añadir el import correspondiente

## T9 — Verificación manual

- Ejecutar la migración en local/staging y confirmar que `event_custom_details` se crea
- Abrir `/mis-eventos/:id` sin `?section=` y confirmar que carga "Invitados" por defecto, no Timeline
- Confirmar que el sidebar ya no muestra "Timeline" (desktop y móvil) y que "Detalles" ahora dice "Detalles personalizados"
- Confirmar que `/mis-eventos/:id?section=timeline` sigue renderizando el Timeline (código intacto, solo sin enlace)
- Como organizador: rellenar los dos campos cortos, el campo interno y subir 2 imágenes, guardar, recargar y comprobar que persiste
- Confirmar que exceder 25/40 caracteres se bloquea tanto en el input como si se fuerza vía API
- Como participante no organizador: confirmar que no puede guardar (403) pero sí ve la galería de ideas
- Revisar visualmente que la galería de ideas se ve bien sin fotos reales (placeholders/iconos)
