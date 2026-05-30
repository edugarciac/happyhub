# Diseño: Dashboard Mis Eventos — Bloques 1 y 2

**Fecha:** 2026-05-30  
**Scope:** Dashboard shell + Timeline horizontal  
**Bloques futuros:** Invitados, Regalo, Entretenimiento, Detalles, Servicios, Fotos, Mensajes (specs separadas)

---

## Contexto

HappyHub tiene una plataforma de eventos colaborativos (collaborative-event-core) con una vista básica en `/eventos/[id]`. Esta spec reemplaza esa vista con un dashboard completo de gestión de eventos: cuadro de mando funcional con sidebar de navegación y timeline visual horizontal interactivo.

La capa de eventos es **independiente del sistema de reservas**, aunque puede enlazar a reservas y servicios de HappyHub.

---

## Bloque 1: Dashboard Shell

### Rutas

| Ruta | Descripción |
|---|---|
| `/mis-eventos/[id]` | Dashboard principal del evento — **nueva ruta** |
| `/eventos/[id]` | Redirige a `/mis-eventos/[id]` (deprecada) |

### Auth

`getServerSideProps` verifica sesión con `getServerSession`. Sin sesión → redirect a `/login?redirect=/mis-eventos/[id]`.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Header HappyHub (global, existente)                │
├──────────┬──────────────────────────────────────────┤
│          │  Top bar: nombre evento + meta + badges  │
│ Sidebar  ├──────────────────────────────────────────┤
│  76px    │                                          │
│  claro   │   Área de contenido activo               │
│          │   (sección seleccionada del sidebar)     │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

**Sin footer** en el dashboard. El header global se mantiene.

### Sidebar

- Fondo: `bg-gray-50` con borde derecho `border-gray-200`
- Ancho fijo: 76px
- Posición: `sticky top-[altura-header]`, altura calculada para llenar la pantalla
- Sección activa: fondo `bg-violet-100`, texto `text-violet-700`
- Secciones inactivas: hover `bg-gray-100`

| Orden | Emoji | Label | Ruta interna |
|---|---|---|---|
| 1 | ⏱ | Timeline | `?section=timeline` (default) |
| 2 | 📋 | Info | `?section=info` |
| 3 | 👥 | Invitados | `?section=invitados` |
| 4 | 🎁 | Regalo | `?section=regalo` |
| 5 | 🎭 | Entretenimiento | `?section=entretenimiento` |
| 6 | 🎀 | Detalles | `?section=detalles` |
| 7 | 🛎 | Servicios | `?section=servicios` |
| 8 | 📸 | Fotos | `?section=fotos` |
| 9 | 💬 | Mensajes | `?section=mensajes` |

La sección activa se gestiona con query param `?section=` para permitir links directos y navegación con el botón atrás del navegador.

### Top bar del evento

Siempre visible encima del contenido activo:
- Nombre del evento (H1 compacto)
- Metadatos: fecha, ubicación, hora, duración, nº invitados
- Badges de estado: "X confirmados" (verde), "Y pendientes" (ámbar)
- Botón "Editar evento" → abre sección Info

### Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/pages/mis-eventos/[id].tsx` | Crear — página principal del dashboard |
| `src/pages/eventos/[id].tsx` | Modificar — añadir redirect a `/mis-eventos/[id]` |
| `src/components/events/EventDashboardLayout.tsx` | Crear — layout con sidebar |
| `src/components/events/EventSidebar.tsx` | Crear — sidebar con iconos |
| `src/components/events/EventTopBar.tsx` | Crear — barra superior del evento |

---

## Bloque 2: Timeline Horizontal

### Estructura visual

```
[ANTES ─────────────] [─── DURANTE ───] [─── DESPUÉS]
━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                ▲ HOY

[📩 Invit.] [🍽️ Catering] [🎁 Regalo] │🎂 HOY│ [👋 Bienvenida] [🎭 Activ.] [📸 Fotos] [+]
  ✓ verde     ✓ verde       ✓ verde    ámbar    ámbar dashed      blanco      opaco    add
```

### Estados de tarjeta

| Estado | Visual | Cuándo |
|---|---|---|
| Completado | Borde verde, fondo `green-50`, badge ✓ | Fecha pasada + marcado como hecho |
| Activo/HOY | Borde ámbar, fondo `yellow-50`, badge HOY | Día del evento |
| Durante activo | Borde ámbar discontinuo, fondo `amber-50` | Hitos del día del evento |
| Pendiente | Borde gris, fondo blanco | Fecha futura próxima |
| Futuro | Borde gris, opacidad 50% | Fecha lejana |

### Interacciones

**Reordenar:** Drag & drop con `@dnd-kit/core` + `@dnd-kit/sortable`. Las tarjetas son arrastrables horizontalmente. Al soltar, se persiste el nuevo orden via `PATCH /api/events/collaborative/[id]/timeline/reorder`.

**Eliminar:** Botón ✕ en esquina superior izquierda de cada tarjeta. Confirm dialog antes de eliminar. `DELETE /api/events/collaborative/[id]/timeline/[hitoId]`.

**Panel de detalle:** Al clicar una tarjeta (sin arrastrar), se expande un panel debajo del timeline. Cada tipo de hito renderiza un formulario específico. El panel se cierra clicando fuera o en ✕.

**Añadir:** Botón "+ Añadir hito" al final del scroll. Abre modal.

### Modal "Añadir hito"

- **Cabecera:** Título + selector de tipo de evento (por defecto: tipo del evento actual; opción "Ver todos")
- **Cuerpo:** Hitos agrupados por fase en grid de cards
- **Hitos ya añadidos:** Desactivados (no duplicables)
- **Acción:** Clic en un hito → `POST /api/events/collaborative/[id]/timeline` → modal se cierra → hito aparece al final de su fase

### Formularios de detalle por tipo de hito

Cada tipo de hito tiene campos específicos:

| Tipo | Campos |
|---|---|
| Invitaciones | Estado envío, nº confirmados, enlace invitación, fecha límite RSVP |
| Catering | Proveedor, menú, nº comensales, notas |
| Regalo | Descripción, presupuesto, responsable coordinación, estado |
| Bienvenida | Hora, responsable, notas |
| Actividades | Descripción, proveedor, hora inicio/fin, responsable |
| Pastel/Piñata | Proveedor, hora, notas |
| Regalos homenajeado | Lista de regalos, responsable entrega |
| Detalles invitados | Descripción detalle, cantidad, responsable |
| Álbum fotos | Enlace álbum, estado envío, fecha envío |
| Mensajes | Tipo (WhatsApp/email), destinatarios, texto, fecha programada |

### Plantillas de admin

Nueva sección en el panel de administración: **Plantillas de evento**.

- CRUD de plantillas por tipo de evento (Cumpleaños, Comunión, Despedida, Team Building, etc.)
- Cada plantilla define: lista de hitos con emoji, nombre, fase, orden por defecto
- Al crear un evento, se aplica la plantilla del tipo seleccionado como punto de partida
- El usuario puede añadir/quitar hitos de cualquier plantilla

### API endpoints nuevos/modificados

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/events/collaborative/[id]/timeline` | Lista de hitos del evento |
| POST | `/api/events/collaborative/[id]/timeline` | Añadir hito |
| DELETE | `/api/events/collaborative/[id]/timeline/[hitoId]` | Eliminar hito |
| PATCH | `/api/events/collaborative/[id]/timeline/[hitoId]` | Actualizar detalle de hito |
| PATCH | `/api/events/collaborative/[id]/timeline/reorder` | Reordenar hitos |
| GET | `/api/admin/event-templates` | Lista de plantillas por tipo |
| POST | `/api/admin/event-templates` | Crear plantilla |
| PATCH | `/api/admin/event-templates/[id]` | Actualizar plantilla |
| DELETE | `/api/admin/event-templates/[id]` | Eliminar plantilla |

### Schema de DB

```sql
-- Tabla ya existente: collaborative_event_timeline
-- (sort_order ya existe en el schema original — no se añade de nuevo)
-- Añadir columnas nuevas:
ALTER TABLE collaborative_event_timeline
  ADD COLUMN phase VARCHAR(20) NOT NULL DEFAULT 'during', -- 'before' | 'during' | 'after'
  ADD COLUMN emoji VARCHAR(10),
  ADD COLUMN hito_type VARCHAR(50), -- 'invitations' | 'catering' | 'gift' | 'welcome' | etc.
  ADD COLUMN detail_data JSONB, -- campos específicos por tipo
  ADD COLUMN completed BOOLEAN DEFAULT FALSE;

-- Nueva tabla: plantillas de admin
CREATE TABLE event_templates (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL, -- 'birthday' | 'farewell' | 'communion' | etc.
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_template_milestones (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  emoji VARCHAR(10),
  title VARCHAR(255) NOT NULL,
  hito_type VARCHAR(50) NOT NULL,
  phase VARCHAR(20) NOT NULL, -- 'before' | 'during' | 'after'
  sort_order INTEGER DEFAULT 0
);
```

### Archivos a crear

| Archivo | Acción |
|---|---|
| `src/components/events/EventTimeline.tsx` | Crear — timeline horizontal con dnd-kit |
| `src/components/events/TimelineCard.tsx` | Crear — tarjeta de hito individual |
| `src/components/events/TimelineDetailPanel.tsx` | Crear — panel de detalle por tipo |
| `src/components/events/AddMilestoneModal.tsx` | Crear — modal añadir hito |
| `src/pages/api/events/collaborative/[id]/timeline.ts` | Crear — GET lista + POST añadir hito |
| `src/pages/api/events/collaborative/[id]/timeline/[hitoId].ts` | Crear — PATCH detalle + DELETE hito |
| `src/pages/api/events/collaborative/[id]/timeline/reorder.ts` | Crear — reordenación |
| `src/pages/api/admin/event-templates.ts` | Crear — CRUD plantillas admin |
| `src/pages/admin/event-templates.tsx` | Crear — UI admin plantillas |
| `database/migrations/011_event_dashboard.sql` | Crear — migración DB |

---

## Dependencias externas

- `@dnd-kit/core` + `@dnd-kit/sortable` — drag & drop del timeline
- No hay nuevas dependencias de terceros para el resto del dashboard

---

## Lo que NO entra en este spec

Los bloques 3-10 (Invitados, Regalo, Entretenimiento, Detalles, Servicios, Fotos, Mensajes, Templates admin UI) se especifican en docs separados una vez este bloque esté implementado y validado.
