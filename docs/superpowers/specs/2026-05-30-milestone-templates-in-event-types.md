# Diseño: Gestión de Hitos de Plantilla en Tipos de Evento

**Fecha:** 2026-05-30
**Scope:** Embeber el mantenimiento de hitos de plantilla dentro de la página `/admin/event-types`, eliminando la necesidad de una pantalla separada.
**Depende de:** Sistema de tipos de evento ya implementado (`/admin/event-types`), tablas `event_templates` + `event_template_milestones` ya existentes.

---

## Contexto

El `AddMilestoneModal` del dashboard de eventos (`EventTimeline.tsx`) carga plantillas de hitos desde `/api/admin/event-templates`. Estas plantillas están en las tablas `event_templates` + `event_template_milestones`, relacionadas con los tipos de evento por un string suelto (`event_type VARCHAR`).

El admin ya tiene una página completa para gestionar tipos de evento (`/admin/event-types`), pero no tiene UI para gestionar los hitos de plantilla asociados. La pantalla `/admin/event-templates` existe pero está separada y no tiene enlace en el menú.

El objetivo es integrar el CRUD de hitos directamente en la página de tipos de evento, sin cambios de esquema ni nuevas páginas.

---

## Decisiones

- **Sin cambios de esquema** — se reutilizan `event_templates` + `event_template_milestones` tal cual.
- **1 template implícito por event_type** — cuando se añade el primer hito a un tipo, el servidor auto-crea el registro `event_templates` si no existe.
- **UI en fila expandible** — cada tipo de evento en el listado tiene un botón "Hitos ▾" que expande una sección inline. El modal de edición de campos del tipo no cambia.
- **`/admin/event-templates`** — queda como está, sin enlace de menú. No se borra ni redirige.

---

## Base de datos

Sin migraciones. Las tablas ya existen:

```sql
-- Ya existe:
event_templates(id, event_type VARCHAR, name VARCHAR, created_at)
event_template_milestones(id, template_id FK, emoji, title, hito_type, phase, sort_order)
```

La lógica de auto-creación del template es en la capa de aplicación (API), no en DB.

---

## API

### Modificación: `POST /api/admin/event-templates` — acción `add_milestone`

Actualmente requiere `template_id`. Se extiende para aceptar también `event_type_name`:

```typescript
// Body (opción nueva):
{
  action: 'add_milestone',
  event_type_name: string;  // nombre del tipo de evento (ej: "Cumpleaños")
  title: string;
  hito_type: string;
  phase: 'before' | 'during' | 'after';
  emoji?: string;
  sort_order?: number;
}
```

**Lógica en el handler:**
1. Si llega `event_type_name` en lugar de `template_id`:
   - Buscar template existente: `SELECT id FROM event_templates WHERE event_type = $1 LIMIT 1`
   - Si no existe → `INSERT INTO event_templates (event_type, name) VALUES ($1, $1) RETURNING id`
   - Usar el id obtenido como `template_id`
2. Insertar el hito como antes

El resto de métodos (GET, DELETE) no cambian.

### Nuevo endpoint: `GET /api/admin/event-types/[id]/milestones`

Devuelve los hitos del template asociado a un tipo de evento:

```typescript
// Response
{
  milestones: {
    id: number;
    template_id: number;
    emoji: string | null;
    title: string;
    hito_type: string;
    phase: 'before' | 'during' | 'after';
    sort_order: number;
  }[]
}
```

Query:
```sql
SELECT etm.*
FROM event_template_milestones etm
JOIN event_templates et ON et.id = etm.template_id
WHERE et.event_type = $1
ORDER BY etm.phase, etm.sort_order, etm.id
```

El parámetro `$1` es el `name` del tipo de evento (obtenido buscando por `id` en `event_types`).

---

## Componentes UI

### Modificación: `src/pages/admin/event-types.tsx`

**Cambio en el listado de tipos de evento:**

Cada fila del listado añade un botón "Hitos ▾" al lado de los botones existentes (editar/eliminar). Al hacer clic alterna la expansión de una sección inline debajo de la fila.

**Sección expandida (por tipo de evento):**

```
[Antes]
  🎂 Reserva del local             hito_type: venue_booking     [✕]
  📧 Envío de invitaciones         hito_type: invitations        [✕]
[Durante]
  🎤 Bienvenida                    hito_type: welcome            [✕]
[Después]
  (vacío)

[+ Añadir hito]  ← toggle inline form
  Emoji: [  ]  Título: [__________]  Tipo: [__________]  Fase: [▾]
  [Añadir]  [Cancelar]
```

**Estado local por tipo de evento:**
- `expandedId: number | null` — qué tipo está expandido (solo uno a la vez)
- `milestones: Record<number, Milestone[]>` — caché de hitos cargados (se cargan lazy al expandir)
- `showAddForm: Record<number, boolean>` — si el formulario de añadir está visible para cada tipo
- `addForm: { emoji, title, hito_type, phase }` — estado del formulario activo

**Flujo de datos:**
1. Click "Hitos ▾" → si no están cargados, `GET /api/admin/event-types/[id]/milestones` → guardar en caché
2. Click "✕" en hito → `DELETE /api/admin/event-templates` con `{ type: 'milestone', id }` → eliminar de caché local
3. Submit "Añadir hito" → `POST /api/admin/event-templates` con `action: 'add_milestone'`, `event_type_name` → añadir a caché local

---

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/pages/api/admin/event-types/[id]/milestones.ts` | Crear (GET hitos por event_type) |
| `src/pages/api/admin/event-templates.ts` | Modificar (añadir soporte `event_type_name` en `add_milestone`) |
| `src/pages/admin/event-types.tsx` | Modificar (añadir sección expandible de hitos) |

---

## Lo que NO entra en este spec

- Reordenación de hitos (drag-and-drop) — queda para iteración futura
- Edición de hitos existentes (solo crear/eliminar)
- Múltiples plantillas por tipo de evento
- Borrado en cascada al borrar un tipo de evento (el template queda huérfano — aceptable)
- Cambios en `AddMilestoneModal` o `EventTimeline` — ya funcionan con las tablas existentes
