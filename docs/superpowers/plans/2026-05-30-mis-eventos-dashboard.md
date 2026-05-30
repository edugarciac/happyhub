# Mis Eventos Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el dashboard completo de gestión de eventos en `/mis-eventos/[id]` con sidebar de navegación claro, timeline horizontal interactivo con drag & drop, modal de añadir hitos, panel de detalle por tipo de hito, y gestión de plantillas en el panel admin.

**Architecture:** Dashboard shell con sidebar icon+label (76px, fondo claro), área de contenido que renderiza la sección activa vía query param `?section=`. Timeline horizontal scrollable con tarjetas arrastrables usando `@dnd-kit/sortable`. Los hitos se persisten en `collaborative_event_timeline` con columnas nuevas (phase, emoji, hito_type, detail_data, completed). Las plantillas de admin viven en dos tablas nuevas (`event_templates`, `event_template_milestones`).

**Tech Stack:** Next.js 14 Pages Router, TypeScript, Tailwind CSS, `@dnd-kit/core` + `@dnd-kit/sortable`, Neon Postgres, Zod, `next-auth`

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `database/migrations/011_event_dashboard.sql` | Crear | Migración DB: ALTER timeline + CREATE templates |
| `src/utils/db/collaborative-events.ts` | Modificar | Actualizar interfaz + helpers del timeline |
| `src/utils/db/event-templates.ts` | Crear | Helpers DB para plantillas de admin |
| `src/pages/api/events/collaborative/[id]/timeline.ts` | Crear | GET lista hitos + POST añadir hito |
| `src/pages/api/events/collaborative/[id]/timeline/[hitoId].ts` | Crear | PATCH detalle + DELETE hito |
| `src/pages/api/events/collaborative/[id]/timeline/reorder.ts` | Crear | PATCH reordenación drag & drop |
| `src/pages/api/admin/event-templates.ts` | Crear | CRUD plantillas admin |
| `src/components/events/EventDashboardLayout.tsx` | Crear | Layout con sidebar + top bar |
| `src/components/events/EventSidebar.tsx` | Crear | Sidebar 76px con iconos y secciones |
| `src/components/events/EventTopBar.tsx` | Crear | Barra nombre evento + meta + badges |
| `src/components/events/EventTimeline.tsx` | Crear | Timeline horizontal con dnd-kit |
| `src/components/events/TimelineCard.tsx` | Crear | Tarjeta de hito individual + estados |
| `src/components/events/TimelineDetailPanel.tsx` | Crear | Panel de detalle por tipo de hito |
| `src/components/events/AddMilestoneModal.tsx` | Crear | Modal añadir hito desde plantilla |
| `src/pages/mis-eventos/[id].tsx` | Crear | Página dashboard principal |
| `src/pages/eventos/[id].tsx` | Modificar | Redirect a `/mis-eventos/[id]` |
| `src/pages/admin/event-templates.tsx` | Crear | UI admin CRUD plantillas |

---

## Task 1: Migración de base de datos

**Files:**
- Create: `database/migrations/011_event_dashboard.sql`

- [ ] **Step 1: Crear el archivo de migración**

```sql
-- database/migrations/011_event_dashboard.sql

-- Extender collaborative_event_timeline con campos del dashboard
ALTER TABLE collaborative_event_timeline
  ADD COLUMN IF NOT EXISTS phase VARCHAR(20) NOT NULL DEFAULT 'during',
  ADD COLUMN IF NOT EXISTS emoji VARCHAR(10),
  ADD COLUMN IF NOT EXISTS hito_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS detail_data JSONB,
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Plantillas de evento (admin)
CREATE TABLE IF NOT EXISTS event_templates (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hitos por defecto de cada plantilla
CREATE TABLE IF NOT EXISTS event_template_milestones (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  emoji VARCHAR(10),
  title VARCHAR(255) NOT NULL,
  hito_type VARCHAR(50) NOT NULL,
  phase VARCHAR(20) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_template_milestones_template ON event_template_milestones(template_id);
```

- [ ] **Step 2: Aplicar la migración en Neon**

```bash
# Obtener DATABASE_URL de Vercel
vercel env pull .env.local --environment=production

# Aplicar migración
node -e "
const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(() => client.query(fs.readFileSync('database/migrations/011_event_dashboard.sql', 'utf8'))).then(() => { console.log('OK'); client.end(); }).catch(e => { console.error(e.message); client.end(); });
"
```

Expected output: `OK`

- [ ] **Step 3: Verificar columnas**

```bash
node -e "
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(() => client.query(\"SELECT column_name FROM information_schema.columns WHERE table_name='collaborative_event_timeline' ORDER BY ordinal_position\")).then(r => { console.log(r.rows.map(x=>x.column_name)); client.end(); });
"
```

Expected: array incluyendo `phase`, `emoji`, `hito_type`, `detail_data`, `completed`

- [ ] **Step 4: Commit**

```bash
git add database/migrations/011_event_dashboard.sql
git commit -m "feat: add event dashboard DB migration (timeline columns + templates tables)"
```

---

## Task 2: Instalar @dnd-kit y actualizar tipos del timeline

**Files:**
- Modify: `src/utils/db/collaborative-events.ts`
- Create: `src/utils/db/event-templates.ts`

- [ ] **Step 1: Instalar dependencias de drag & drop**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: instalación sin errores, package.json actualizado.

- [ ] **Step 2: Actualizar la interfaz `CollaborativeEventTimeline`**

En `src/utils/db/collaborative-events.ts`, reemplazar la interfaz existente:

```typescript
export interface CollaborativeEventTimeline {
  id: number;
  event_id: number;
  time: string | null;
  title: string;
  description: string | null;
  responsible_participant_id: number | null;
  sort_order: number;
  // Nuevos campos del dashboard
  phase: 'before' | 'during' | 'after';
  emoji: string | null;
  hito_type: string | null;
  detail_data: Record<string, any> | null;
  completed: boolean;
}
```

- [ ] **Step 3: Crear helpers DB para plantillas**

Crear `src/utils/db/event-templates.ts`:

```typescript
import { query } from '@/lib/db';

export interface EventTemplate {
  id: number;
  event_type: string;
  name: string;
  created_at: string;
}

export interface EventTemplateMilestone {
  id: number;
  template_id: number;
  emoji: string | null;
  title: string;
  hito_type: string;
  phase: 'before' | 'during' | 'after';
  sort_order: number;
}

export async function getTemplatesByEventType(eventType: string): Promise<EventTemplateMilestone[]> {
  const tmpl = await query<EventTemplate>(
    `SELECT * FROM event_templates WHERE event_type = $1 LIMIT 1`,
    [eventType]
  );
  if (!tmpl.rows.length) return [];
  const result = await query<EventTemplateMilestone>(
    `SELECT * FROM event_template_milestones WHERE template_id = $1 ORDER BY phase, sort_order`,
    [tmpl.rows[0].id]
  );
  return result.rows;
}

export async function getAllTemplatesWithMilestones(): Promise<{ template: EventTemplate; milestones: EventTemplateMilestone[] }[]> {
  const templates = await query<EventTemplate>(`SELECT * FROM event_templates ORDER BY event_type`);
  const result = await Promise.all(
    templates.rows.map(async (t) => {
      const ms = await query<EventTemplateMilestone>(
        `SELECT * FROM event_template_milestones WHERE template_id = $1 ORDER BY phase, sort_order`,
        [t.id]
      );
      return { template: t, milestones: ms.rows };
    })
  );
  return result;
}

export async function createTemplate(eventType: string, name: string): Promise<EventTemplate> {
  const result = await query<EventTemplate>(
    `INSERT INTO event_templates (event_type, name) VALUES ($1, $2) RETURNING *`,
    [eventType, name]
  );
  return result.rows[0];
}

export async function addMilestoneToTemplate(
  templateId: number,
  milestone: Omit<EventTemplateMilestone, 'id' | 'template_id'>
): Promise<EventTemplateMilestone> {
  const result = await query<EventTemplateMilestone>(
    `INSERT INTO event_template_milestones (template_id, emoji, title, hito_type, phase, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [templateId, milestone.emoji, milestone.title, milestone.hito_type, milestone.phase, milestone.sort_order]
  );
  return result.rows[0];
}

export async function deleteTemplate(id: number): Promise<void> {
  await query(`DELETE FROM event_templates WHERE id = $1`, [id]);
}

export async function deleteMilestone(id: number): Promise<void> {
  await query(`DELETE FROM event_template_milestones WHERE id = $1`, [id]);
}
```

- [ ] **Step 4: Verificar tipos con TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sin errores relacionados con los nuevos tipos.

- [ ] **Step 5: Commit**

```bash
git add src/utils/db/collaborative-events.ts src/utils/db/event-templates.ts package.json package-lock.json
git commit -m "feat: install dnd-kit, update timeline types, add event-templates db helpers"
```

---

## Task 3: API — Timeline CRUD

**Files:**
- Create: `src/pages/api/events/collaborative/[id]/timeline.ts`
- Create: `src/pages/api/events/collaborative/[id]/timeline/[hitoId].ts`
- Create: `src/pages/api/events/collaborative/[id]/timeline/reorder.ts`

- [ ] **Step 1: Crear `timeline.ts` (GET + POST)**

Crear `src/pages/api/events/collaborative/[id]/timeline.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import {
  ensureCollaborativeEventsSchema,
  getCollaborativeEventById,
  getParticipantByUserId,
} from '@/utils/db/collaborative-events';

const addSchema = z.object({
  title: z.string().min(1).max(255),
  emoji: z.string().max(10).optional(),
  hito_type: z.string().max(50),
  phase: z.enum(['before', 'during', 'after']),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  detail_data: z.record(z.any()).optional().nullable(),
  sort_order: z.number().int().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await ensureCollaborativeEventsSchema();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  if (req.method === 'GET') {
    const result = await query(
      `SELECT * FROM collaborative_event_timeline WHERE event_id = $1 ORDER BY phase, sort_order, time`,
      [eventId]
    );
    return res.status(200).json({ milestones: result.rows });
  }

  if (req.method === 'POST') {
    if (!isOrganizer) return res.status(403).json({ error: 'Solo el organizador puede añadir hitos' });

    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { title, emoji, hito_type, phase, time, description, detail_data, sort_order } = parsed.data;

    // Calcular sort_order si no viene
    const maxOrder = await query(
      `SELECT COALESCE(MAX(sort_order), -1) as max FROM collaborative_event_timeline WHERE event_id = $1 AND phase = $2`,
      [eventId, phase]
    );
    const nextOrder = sort_order ?? (maxOrder.rows[0].max + 1);

    const result = await query(
      `INSERT INTO collaborative_event_timeline
         (event_id, title, emoji, hito_type, phase, time, description, detail_data, sort_order, completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
       RETURNING *`,
      [eventId, title, emoji ?? null, hito_type, phase, time ?? null, description ?? null,
       detail_data ? JSON.stringify(detail_data) : null, nextOrder]
    );
    return res.status(201).json({ milestone: result.rows[0] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 2: Crear `timeline/[hitoId].ts` (PATCH + DELETE)**

Crear `src/pages/api/events/collaborative/[id]/timeline/[hitoId].ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  completed: z.boolean().optional(),
  detail_data: z.record(z.any()).optional().nullable(),
  phase: z.enum(['before', 'during', 'after']).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const hitoId = parseInt(req.query.hitoId as string, 10);

  if (isNaN(eventId) || isNaN(hitoId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.organizer_id !== userId) return res.status(403).json({ error: 'Solo el organizador puede editar hitos' });

  // Verificar que el hito pertenece al evento
  const existing = await query(
    `SELECT id FROM collaborative_event_timeline WHERE id = $1 AND event_id = $2`,
    [hitoId, eventId]
  );
  if (!existing.rows.length) return res.status(404).json({ error: 'Hito no encontrado' });

  if (req.method === 'PATCH') {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const d = parsed.data;
    if (d.title !== undefined) { fields.push(`title = $${idx++}`); values.push(d.title); }
    if (d.time !== undefined) { fields.push(`time = $${idx++}`); values.push(d.time); }
    if (d.description !== undefined) { fields.push(`description = $${idx++}`); values.push(d.description); }
    if (d.completed !== undefined) { fields.push(`completed = $${idx++}`); values.push(d.completed); }
    if (d.detail_data !== undefined) { fields.push(`detail_data = $${idx++}`); values.push(d.detail_data ? JSON.stringify(d.detail_data) : null); }
    if (d.phase !== undefined) { fields.push(`phase = $${idx++}`); values.push(d.phase); }

    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });

    values.push(hitoId);
    const result = await query(
      `UPDATE collaborative_event_timeline SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.status(200).json({ milestone: result.rows[0] });
  }

  if (req.method === 'DELETE') {
    await query(`DELETE FROM collaborative_event_timeline WHERE id = $1`, [hitoId]);
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 3: Crear `timeline/reorder.ts` (PATCH reordenación)**

Crear `src/pages/api/events/collaborative/[id]/timeline/reorder.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';

const reorderSchema = z.object({
  orderedIds: z.array(z.number().int()).min(1),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.organizer_id !== userId) return res.status(403).json({ error: 'Sin permisos' });

  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { orderedIds } = parsed.data;

  // Actualizar sort_order de cada hito en lote
  await Promise.all(
    orderedIds.map((id, index) =>
      query(
        `UPDATE collaborative_event_timeline SET sort_order = $1 WHERE id = $2 AND event_id = $3`,
        [index, id, eventId]
      )
    )
  );

  return res.status(200).json({ reordered: true });
}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/events/collaborative/
git commit -m "feat: add timeline CRUD API endpoints (GET, POST, PATCH, DELETE, reorder)"
```

---

## Task 4: API — Plantillas de admin

**Files:**
- Create: `src/pages/api/admin/event-templates.ts`

- [ ] **Step 1: Crear el endpoint**

Crear `src/pages/api/admin/event-templates.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminSession } from '@/utils/adminAuth';
import { z } from 'zod';
import {
  getAllTemplatesWithMilestones,
  createTemplate,
  addMilestoneToTemplate,
  deleteTemplate,
  deleteMilestone,
} from '@/utils/db/event-templates';
import { query } from '@/lib/db';

const createTemplateSchema = z.object({
  event_type: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
});

const addMilestoneSchema = z.object({
  template_id: z.number().int(),
  emoji: z.string().max(10).optional(),
  title: z.string().min(1).max(255),
  hito_type: z.string().min(1).max(50),
  phase: z.enum(['before', 'during', 'after']),
  sort_order: z.number().int().optional().default(0),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await verifyAdminSession(req, res);
  if (!admin) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'GET') {
    const data = await getAllTemplatesWithMilestones();
    return res.status(200).json({ templates: data });
  }

  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'create_template') {
      const parsed = createTemplateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const template = await createTemplate(parsed.data.event_type, parsed.data.name);
      return res.status(201).json({ template });
    }

    if (action === 'add_milestone') {
      const parsed = addMilestoneSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const milestone = await addMilestoneToTemplate(parsed.data.template_id, parsed.data);
      return res.status(201).json({ milestone });
    }

    return res.status(400).json({ error: 'Acción desconocida' });
  }

  if (req.method === 'DELETE') {
    const { type, id } = req.body;
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ error: 'ID requerido' });

    if (type === 'template') {
      await deleteTemplate(parseInt(id));
      return res.status(200).json({ deleted: true });
    }
    if (type === 'milestone') {
      await deleteMilestone(parseInt(id));
      return res.status(200).json({ deleted: true });
    }
    return res.status(400).json({ error: 'Tipo inválido' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/event-templates.ts
git commit -m "feat: add admin event-templates API endpoint"
```

---

## Task 5: Componentes del Dashboard Shell

**Files:**
- Create: `src/components/events/EventSidebar.tsx`
- Create: `src/components/events/EventTopBar.tsx`
- Create: `src/components/events/EventDashboardLayout.tsx`

- [ ] **Step 1: Crear `EventSidebar.tsx`**

```typescript
// src/components/events/EventSidebar.tsx
import Link from 'next/link';

const SECTIONS = [
  { id: 'timeline', emoji: '⏱', label: 'Timeline' },
  { id: 'info', emoji: '📋', label: 'Info' },
  { id: 'invitados', emoji: '👥', label: 'Invitados' },
  { id: 'regalo', emoji: '🎁', label: 'Regalo' },
  { id: 'entretenimiento', emoji: '🎭', label: 'Entret.' },
  { id: 'detalles', emoji: '🎀', label: 'Detalles' },
  { id: 'servicios', emoji: '🛎', label: 'Servicios' },
  { id: 'fotos', emoji: '📸', label: 'Fotos' },
  { id: 'mensajes', emoji: '💬', label: 'Mensajes' },
] as const;

interface EventSidebarProps {
  eventId: number;
  activeSection: string;
}

export default function EventSidebar({ eventId, activeSection }: EventSidebarProps) {
  return (
    <aside className="w-[76px] flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-3 gap-1 sticky top-16 self-start min-h-[calc(100vh-4rem)] overflow-y-auto">
      {SECTIONS.map((s) => {
        const isActive = activeSection === s.id;
        return (
          <Link
            key={s.id}
            href={`/mis-eventos/${eventId}?section=${s.id}`}
            className={`w-[60px] rounded-lg py-2 px-1 flex flex-col items-center gap-0.5 transition-colors ${
              isActive
                ? 'bg-violet-100 text-violet-700'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <span className="text-xl leading-none">{s.emoji}</span>
            <span className={`text-[9px] font-medium text-center leading-tight ${isActive ? 'text-violet-700' : ''}`}>
              {s.label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
```

- [ ] **Step 2: Crear `EventTopBar.tsx`**

```typescript
// src/components/events/EventTopBar.tsx
import type { CollaborativeEvent, CollaborativeEventParticipant } from '@/utils/db/collaborative-events';

interface EventTopBarProps {
  event: CollaborativeEvent;
  participants: CollaborativeEventParticipant[];
}

export default function EventTopBar({ event, participants }: EventTopBarProps) {
  const confirmed = participants.filter((p) => p.rsvp_status === 'confirmed').length;
  const pending = participants.filter((p) => p.rsvp_status === 'pending').length;

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-lg font-bold text-gray-900 leading-tight">{event.title}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5 flex-wrap">
          {event.event_date && <span>📅 {formatDate(event.event_date)}</span>}
          {event.event_time && <span>🕕 {event.event_time.slice(0, 5)}</span>}
          {event.location && <span>📍 {event.location}</span>}
          <span>👥 {participants.length} invitados</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {confirmed > 0 && (
          <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            ✓ {confirmed} confirmados
          </span>
        )}
        {pending > 0 && (
          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            ⏳ {pending} pendientes
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `EventDashboardLayout.tsx`**

```typescript
// src/components/events/EventDashboardLayout.tsx
import Header from '@/components/Header';
import EventSidebar from './EventSidebar';
import EventTopBar from './EventTopBar';
import type { CollaborativeEvent, CollaborativeEventParticipant } from '@/utils/db/collaborative-events';

interface EventDashboardLayoutProps {
  event: CollaborativeEvent;
  participants: CollaborativeEventParticipant[];
  activeSection: string;
  children: React.ReactNode;
}

export default function EventDashboardLayout({
  event,
  participants,
  activeSection,
  children,
}: EventDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <EventSidebar eventId={event.id} activeSection={activeSection} />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] overflow-hidden">
          <EventTopBar event={event} participants={participants} />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/components/events/EventSidebar.tsx src/components/events/EventTopBar.tsx src/components/events/EventDashboardLayout.tsx
git commit -m "feat: add EventDashboardLayout, EventSidebar, EventTopBar components"
```

---

## Task 6: Componentes del Timeline

**Files:**
- Create: `src/components/events/TimelineCard.tsx`
- Create: `src/components/events/TimelineDetailPanel.tsx`
- Create: `src/components/events/AddMilestoneModal.tsx`
- Create: `src/components/events/EventTimeline.tsx`

- [ ] **Step 1: Crear `TimelineCard.tsx`**

```typescript
// src/components/events/TimelineCard.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CollaborativeEventTimeline } from '@/utils/db/collaborative-events';

interface TimelineCardProps {
  milestone: CollaborativeEventTimeline;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  isOrganizer: boolean;
}

function cardStyle(milestone: CollaborativeEventTimeline, isToday: boolean) {
  if (milestone.completed) return 'border-green-400 bg-green-50';
  if (isToday && milestone.phase === 'during') return 'border-amber-400 bg-amber-50 border-dashed';
  if (isToday && milestone.phase === 'before') return 'border-amber-500 bg-yellow-50';
  if (milestone.phase === 'after') return 'border-gray-200 bg-gray-50 opacity-60';
  return 'border-gray-200 bg-white';
}

export default function TimelineCard({
  milestone, isToday, isSelected, onClick, onDelete, isOrganizer,
}: TimelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: milestone.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex-shrink-0 w-[110px] border-2 rounded-xl p-2 text-center cursor-pointer select-none transition-shadow ${
        cardStyle(milestone, isToday)
      } ${isSelected ? 'ring-2 ring-violet-400 ring-offset-1' : ''}`}
      onClick={onClick}
    >
      {/* Drag handle */}
      {isOrganizer && (
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 rounded-xl cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Delete button */}
      {isOrganizer && (
        <button
          className="absolute -top-2 -left-2 w-5 h-5 bg-gray-200 hover:bg-red-400 hover:text-white text-gray-500 rounded-full flex items-center justify-center text-[10px] z-10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Eliminar hito"
        >
          ✕
        </button>
      )}

      {/* Completado badge */}
      {milestone.completed && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] z-10">
          ✓
        </div>
      )}

      {/* HOY badge */}
      {isToday && milestone.phase !== 'after' && !milestone.completed && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap z-10">
          HOY
        </div>
      )}

      <div className="text-xl mb-1 mt-1">{milestone.emoji || '📌'}</div>
      <div className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2">
        {milestone.title}
      </div>
      {milestone.time && (
        <div className="text-[10px] text-gray-500 mt-1">{milestone.time.slice(0, 5)}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Crear `TimelineDetailPanel.tsx`**

```typescript
// src/components/events/TimelineDetailPanel.tsx
import { useState } from 'react';
import type { CollaborativeEventTimeline } from '@/utils/db/collaborative-events';

interface TimelineDetailPanelProps {
  milestone: CollaborativeEventTimeline;
  onClose: () => void;
  onUpdate: (updated: CollaborativeEventTimeline) => void;
  eventId: number;
  isOrganizer: boolean;
}

export default function TimelineDetailPanel({
  milestone, onClose, onUpdate, eventId, isOrganizer,
}: TimelineDetailPanelProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: milestone.title,
    time: milestone.time?.slice(0, 5) ?? '',
    description: milestone.description ?? '',
    completed: milestone.completed,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/timeline/${milestone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          time: form.time || null,
          description: form.description || null,
          completed: form.completed,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.milestone);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5 border-l-4 border-l-violet-400">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{milestone.emoji || '📌'}</span>
          <h3 className="font-bold text-gray-900">{milestone.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg font-bold"
        >
          ✕
        </button>
      </div>

      {isOrganizer ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Hora</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notas</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="completed"
              checked={form.completed}
              onChange={(e) => setForm({ ...form, completed: e.target.checked })}
              className="w-4 h-4 accent-green-500"
            />
            <label htmlFor="completed" className="text-sm font-medium text-gray-700">Marcar como completado</label>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600 space-y-2">
          {milestone.time && <p>🕕 {milestone.time.slice(0, 5)}</p>}
          {milestone.description && <p>{milestone.description}</p>}
          <p>{milestone.completed ? '✅ Completado' : '⏳ Pendiente'}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Crear `AddMilestoneModal.tsx`**

```typescript
// src/components/events/AddMilestoneModal.tsx
import { useState, useEffect } from 'react';

export interface MilestoneTemplate {
  id: number;
  emoji: string | null;
  title: string;
  hito_type: string;
  phase: 'before' | 'during' | 'after';
}

interface AddMilestoneModalProps {
  eventId: number;
  eventType: string | null;
  existingTypes: string[];
  onClose: () => void;
  onAdded: (milestone: any) => void;
}

const PHASE_LABELS = { before: 'Antes', during: 'Durante', after: 'Después' };
const PHASES: Array<'before' | 'during' | 'after'> = ['before', 'during', 'after'];

export default function AddMilestoneModal({
  eventId, eventType, existingTypes, onClose, onAdded,
}: AddMilestoneModalProps) {
  const [templates, setTemplates] = useState<{ template: any; milestones: MilestoneTemplate[] }[]>([]);
  const [selectedType, setSelectedType] = useState<string>(eventType ?? '');
  const [adding, setAdding] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/event-templates')
      .then((r) => r.json())
      .then((d) => { setTemplates(d.templates || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const currentMilestones = selectedType
    ? templates.find((t) => t.template.event_type === selectedType)?.milestones ?? []
    : templates.flatMap((t) => t.milestones);

  const handleAdd = async (m: MilestoneTemplate) => {
    setAdding(m.hito_type);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: m.title,
          emoji: m.emoji,
          hito_type: m.hito_type,
          phase: m.phase,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onAdded(data.milestone);
        onClose();
      }
    } finally {
      setAdding(null);
    }
  };

  const allTypes = [...new Set(templates.map((t) => t.template.event_type))];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Añadir hito al timeline</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        {/* Selector de tipo de evento */}
        <div className="px-5 pt-4 pb-2 flex gap-2 flex-wrap">
          {allTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(selectedType === type ? '' : type)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                selectedType === type
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'border-gray-200 text-gray-600 hover:border-violet-300'
              }`}
            >
              {type}
            </button>
          ))}
          {selectedType && (
            <button
              onClick={() => setSelectedType('')}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600"
            >
              Ver todos
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Cargando plantillas...</div>
          ) : (
            PHASES.map((phase) => {
              const items = currentMilestones.filter((m) => m.phase === phase);
              if (!items.length) return null;
              return (
                <div key={phase} className="mt-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {PHASE_LABELS[phase]}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((m) => {
                      const alreadyAdded = existingTypes.includes(m.hito_type);
                      return (
                        <button
                          key={m.id}
                          disabled={alreadyAdded || adding === m.hito_type}
                          onClick={() => handleAdd(m)}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${
                            alreadyAdded
                              ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50 cursor-pointer'
                          }`}
                        >
                          <span className="text-xl">{m.emoji || '📌'}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{m.title}</div>
                            {alreadyAdded && <div className="text-[10px] text-gray-400">Ya añadido</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Crear `EventTimeline.tsx`**

```typescript
// src/components/events/EventTimeline.tsx
import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { CollaborativeEventTimeline } from '@/utils/db/collaborative-events';
import TimelineCard from './TimelineCard';
import TimelineDetailPanel from './TimelineDetailPanel';
import AddMilestoneModal from './AddMilestoneModal';

interface EventTimelineProps {
  eventId: number;
  initialMilestones: CollaborativeEventTimeline[];
  eventDate: string | null;
  eventType: string | null;
  isOrganizer: boolean;
}

function isEventToday(eventDate: string | null): boolean {
  if (!eventDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return eventDate.slice(0, 10) === today;
}

export default function EventTimeline({
  eventId, initialMilestones, eventDate, eventType, isOrganizer,
}: EventTimelineProps) {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const today = isEventToday(eventDate);
  const selected = milestones.find((m) => m.id === selectedId) ?? null;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setMilestones((prev) => {
      const oldIndex = prev.findIndex((m) => m.id === active.id);
      const newIndex = prev.findIndex((m) => m.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      // Persistir reordenación
      fetch(`/api/events/collaborative/${eventId}/timeline/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: reordered.map((m) => m.id) }),
      });

      return reordered;
    });
  }, [eventId]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('¿Eliminar este hito del timeline?')) return;
    const res = await fetch(`/api/events/collaborative/${eventId}/timeline/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMilestones((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  }, [eventId, selectedId]);

  const handleUpdate = useCallback((updated: CollaborativeEventTimeline) => {
    setMilestones((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  // Barra de progreso
  const total = milestones.length;
  const done = milestones.filter((m) => m.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      {/* Barra de progreso */}
      <div className="flex items-center gap-3 mb-6 bg-white border border-gray-200 rounded-xl p-3">
        <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">ANTES</span>
        <div className="flex-1 relative h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-amber-400 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
          {today && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-500 border-2 border-white rounded-full shadow"
              style={{ left: `${pct}%`, transform: 'translate(-50%, -50%)' }}
            />
          )}
        </div>
        <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">DESPUÉS</span>
        <span className="text-xs text-gray-400">{done}/{total}</span>
      </div>

      {/* Etiquetas de fase */}
      <div className="flex text-[10px] font-bold text-gray-400 mb-2 gap-2 uppercase">
        <span className="text-blue-500">◀ Antes</span>
        <span className="flex-1 text-center text-amber-500">Durante</span>
        <span className="text-green-500">Después ▶</span>
      </div>

      {/* Timeline horizontal con dnd-kit */}
      <div className="overflow-x-auto pb-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={milestones.map((m) => m.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-3 items-start min-w-max">
              {milestones.map((m) => (
                <TimelineCard
                  key={m.id}
                  milestone={m}
                  isToday={today}
                  isSelected={selectedId === m.id}
                  onClick={() => setSelectedId(selectedId === m.id ? null : m.id)}
                  onDelete={() => handleDelete(m.id)}
                  isOrganizer={isOrganizer}
                />
              ))}

              {/* Botón añadir */}
              {isOrganizer && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex-shrink-0 w-[90px] border-2 border-dashed border-violet-300 rounded-xl p-3 text-center bg-violet-50 hover:bg-violet-100 transition-colors cursor-pointer"
                >
                  <div className="text-2xl text-violet-500">+</div>
                  <div className="text-[10px] font-semibold text-violet-500">Añadir hito</div>
                </button>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Panel de detalle */}
      {selected && (
        <TimelineDetailPanel
          milestone={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdate}
          eventId={eventId}
          isOrganizer={isOrganizer}
        />
      )}

      {/* Modal añadir hito */}
      {showAddModal && (
        <AddMilestoneModal
          eventId={eventId}
          eventType={eventType}
          existingTypes={milestones.map((m) => m.hito_type).filter(Boolean) as string[]}
          onClose={() => setShowAddModal(false)}
          onAdded={(m) => setMilestones((prev) => [...prev, m])}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/components/events/TimelineCard.tsx src/components/events/TimelineDetailPanel.tsx src/components/events/AddMilestoneModal.tsx src/components/events/EventTimeline.tsx
git commit -m "feat: add EventTimeline, TimelineCard, TimelineDetailPanel, AddMilestoneModal components"
```

---

## Task 7: Página del dashboard `/mis-eventos/[id]`

**Files:**
- Create: `src/pages/mis-eventos/[id].tsx`
- Modify: `src/pages/eventos/[id].tsx`

- [ ] **Step 1: Crear directorio y la página**

```bash
mkdir -p src/pages/mis-eventos
```

Crear `src/pages/mis-eventos/[id].tsx`:

```typescript
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  ensureCollaborativeEventsSchema,
  getCollaborativeEventById,
  getParticipants,
  getTimeline,
  getParticipantByUserId,
  type CollaborativeEvent,
  type CollaborativeEventParticipant,
  type CollaborativeEventTimeline,
} from '@/utils/db/collaborative-events';
import EventDashboardLayout from '@/components/events/EventDashboardLayout';
import EventTimeline from '@/components/events/EventTimeline';

interface Props {
  event: CollaborativeEvent;
  participants: CollaborativeEventParticipant[];
  milestones: CollaborativeEventTimeline[];
  isOrganizer: boolean;
  section: string;
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user) {
    return { redirect: { destination: `/login?redirect=/mis-eventos/${context.params?.id}`, permanent: false } };
  }

  await ensureCollaborativeEventsSchema();

  const eventId = parseInt(context.params?.id as string, 10);
  if (isNaN(eventId)) return { notFound: true };

  const event = await getCollaborativeEventById(eventId);
  if (!event) return { notFound: true };

  const userId = parseInt((session.user as any).id as string, 10);
  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;

  if (!participant && !isOrganizer) {
    return { redirect: { destination: '/area-privada', permanent: false } };
  }

  const [participants, milestones] = await Promise.all([
    getParticipants(eventId),
    getTimeline(eventId),
  ]);

  const section = (context.query.section as string) || 'timeline';

  return {
    props: {
      event: JSON.parse(JSON.stringify(event)),
      participants: JSON.parse(JSON.stringify(participants)),
      milestones: JSON.parse(JSON.stringify(milestones)),
      isOrganizer,
      section,
    },
  };
};

function SectionPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <div className="text-4xl mb-3">🚧</div>
      <p className="font-medium">Sección <strong>{label}</strong> — próximamente</p>
    </div>
  );
}

export default function MisEventosDashboard({ event, participants, milestones, isOrganizer, section }: Props) {
  const renderSection = () => {
    switch (section) {
      case 'timeline':
        return (
          <EventTimeline
            eventId={event.id}
            initialMilestones={milestones}
            eventDate={event.event_date}
            eventType={event.category}
            isOrganizer={isOrganizer}
          />
        );
      case 'info': return <SectionPlaceholder label="Info" />;
      case 'invitados': return <SectionPlaceholder label="Invitados" />;
      case 'regalo': return <SectionPlaceholder label="Regalo" />;
      case 'entretenimiento': return <SectionPlaceholder label="Entretenimiento" />;
      case 'detalles': return <SectionPlaceholder label="Detalles" />;
      case 'servicios': return <SectionPlaceholder label="Servicios" />;
      case 'fotos': return <SectionPlaceholder label="Fotos" />;
      case 'mensajes': return <SectionPlaceholder label="Mensajes" />;
      default: return <SectionPlaceholder label={section} />;
    }
  };

  return (
    <>
      <Head>
        <title>{event.title} – Mis Eventos | HappyHub</title>
      </Head>
      <EventDashboardLayout event={event} participants={participants} activeSection={section}>
        {renderSection()}
      </EventDashboardLayout>
    </>
  );
}
```

- [ ] **Step 2: Redirigir `/eventos/[id]` al nuevo dashboard**

Leer `src/pages/eventos/[id].tsx` y reemplazar el export default por un redirect en getServerSideProps. Añadir al inicio del archivo, antes del componente existente:

```typescript
// Añadir al principio de src/pages/eventos/[id].tsx (después de los imports):
export { default } from '@/pages/mis-eventos/[id]';
export { getServerSideProps } from '@/pages/mis-eventos/[id]';
```

Alternativamente, si el re-export de getServerSideProps da conflictos con el archivo existente, sustituir todo el contenido del archivo `src/pages/eventos/[id].tsx` por:

```typescript
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    redirect: {
      destination: `/mis-eventos/${context.params?.id}`,
      permanent: false,
    },
  };
};

export default function RedirectPage() {
  return null;
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: sin errores.

- [ ] **Step 4: Probar localmente**

```bash
npm run dev
```

Abrir `http://localhost:3000/mis-eventos/<id>` con un evento existente (obtener ID de la DB o del área privada). Verificar:
- Dashboard carga con sidebar y topbar
- Timeline se renderiza (vacío si no hay hitos)
- `http://localhost:3000/eventos/<id>` redirige al nuevo dashboard

- [ ] **Step 5: Commit**

```bash
git add src/pages/mis-eventos/ src/pages/eventos/[id].tsx
git commit -m "feat: add /mis-eventos/[id] dashboard page, redirect /eventos/[id]"
```

---

## Task 8: UI admin — Plantillas de evento

**Files:**
- Create: `src/pages/admin/event-templates.tsx`

- [ ] **Step 1: Crear la página de admin**

Crear `src/pages/admin/event-templates.tsx`:

```typescript
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';

interface Milestone {
  id: number;
  template_id: number;
  emoji: string | null;
  title: string;
  hito_type: string;
  phase: 'before' | 'during' | 'after';
  sort_order: number;
}

interface Template {
  template: { id: number; event_type: string; name: string };
  milestones: Milestone[];
}

const PHASE_LABELS = { before: 'Antes', during: 'Durante', after: 'Después' };
const PHASES: Array<'before' | 'during' | 'after'> = ['before', 'during', 'after'];

const emptyMilestoneForm = { emoji: '', title: '', hito_type: '', phase: 'before' as const, sort_order: 0 };

export default function AdminEventTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState({ event_type: '', name: '' });
  const [addingMilestone, setAddingMilestone] = useState<number | null>(null);
  const [milestoneForm, setMilestoneForm] = useState(emptyMilestoneForm);

  const fetchTemplates = () => {
    fetch('/api/admin/event-templates')
      .then((r) => r.json())
      .then((d) => { setTemplates(d.templates || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplate.event_type || !newTemplate.name) return;
    const res = await fetch('/api/admin/event-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_template', ...newTemplate }),
    });
    if (res.ok) {
      toast.success('Plantilla creada');
      setNewTemplate({ event_type: '', name: '' });
      fetchTemplates();
    }
  };

  const handleAddMilestone = async (templateId: number) => {
    if (!milestoneForm.title || !milestoneForm.hito_type) return;
    const res = await fetch('/api/admin/event-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_milestone', template_id: templateId, ...milestoneForm }),
    });
    if (res.ok) {
      toast.success('Hito añadido');
      setAddingMilestone(null);
      setMilestoneForm(emptyMilestoneForm);
      fetchTemplates();
    }
  };

  const handleDelete = async (type: 'template' | 'milestone', id: number) => {
    if (!confirm(`¿Eliminar este ${type === 'template' ? 'plantilla' : 'hito'}?`)) return;
    const res = await fetch('/api/admin/event-templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    });
    if (res.ok) {
      toast.success('Eliminado');
      fetchTemplates();
    }
  };

  return (
    <AdminLayout>
      <Head><title>Plantillas de evento – Admin HappyHub</title></Head>
      <Toaster />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Plantillas de evento</h1>
            <p className="text-gray-500 text-sm mt-1">Configura los hitos por defecto para cada tipo de evento</p>
          </div>
        </div>

        {/* Crear nueva plantilla */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">Nueva plantilla</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Tipo (ej: birthday)"
              value={newTemplate.event_type}
              onChange={(e) => setNewTemplate({ ...newTemplate, event_type: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              type="text"
              placeholder="Nombre (ej: Cumpleaños)"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button
              onClick={handleCreateTemplate}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Crear
            </button>
          </div>
        </div>

        {/* Lista de plantillas */}
        {loading ? (
          <p className="text-gray-400 text-center py-10">Cargando...</p>
        ) : (
          templates.map(({ template, milestones }) => (
            <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-bold text-gray-900">{template.name}</span>
                  <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{template.event_type}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setAddingMilestone(template.id); setMilestoneForm(emptyMilestoneForm); }}
                    className="text-violet-600 border border-violet-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-violet-50 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Añadir hito
                  </button>
                  <button
                    onClick={() => handleDelete('template', template.id)}
                    className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Formulario añadir hito */}
              {addingMilestone === template.id && (
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-4 grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Emoji (ej: 📩)" value={milestoneForm.emoji} onChange={(e) => setMilestoneForm({ ...milestoneForm, emoji: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  <input type="text" placeholder="Título *" value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  <input type="text" placeholder="hito_type (ej: invitations) *" value={milestoneForm.hito_type} onChange={(e) => setMilestoneForm({ ...milestoneForm, hito_type: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  <select value={milestoneForm.phase} onChange={(e) => setMilestoneForm({ ...milestoneForm, phase: e.target.value as any })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                    {PHASES.map((p) => <option key={p} value={p}>{PHASE_LABELS[p]}</option>)}
                  </select>
                  <div className="col-span-2 flex gap-2 justify-end">
                    <button onClick={() => setAddingMilestone(null)} className="text-sm text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancelar</button>
                    <button onClick={() => handleAddMilestone(template.id)} className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-violet-700">Guardar hito</button>
                  </div>
                </div>
              )}

              {/* Hitos por fase */}
              {PHASES.map((phase) => {
                const items = milestones.filter((m) => m.phase === phase);
                if (!items.length) return null;
                return (
                  <div key={phase} className="mb-3">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-2">{PHASE_LABELS[phase]}</div>
                    <div className="flex flex-wrap gap-2">
                      {items.map((m) => (
                        <div key={m.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                          {m.emoji && <span>{m.emoji}</span>}
                          <span className="font-medium text-gray-700">{m.title}</span>
                          <span className="text-gray-400 text-xs">({m.hito_type})</span>
                          <button onClick={() => handleDelete('milestone', m.id)} className="text-gray-300 hover:text-red-400 ml-1">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {milestones.length === 0 && (
                <p className="text-gray-400 text-sm">Sin hitos. Añade el primero.</p>
              )}
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/event-templates.tsx
git commit -m "feat: add admin event-templates management page"
```

---

## Task 9: Deploy y verificación final

- [ ] **Step 1: Build de producción**

```bash
npm run build 2>&1 | tail -20
```

Expected: Build completed sin errores.

- [ ] **Step 2: Push a main**

```bash
git push origin main
```

- [ ] **Step 3: Verificar en producción (happyhub.es)**

1. Navegar a `/mis-eventos` — redirige al área privada si hay sesión
2. Desde el área privada, abrir un evento existente — carga `/mis-eventos/[id]`
3. Verificar sidebar con las 9 secciones
4. Verificar top bar con nombre, fecha, invitados, badges
5. Verificar sección Timeline renderiza (vacía o con hitos existentes)
6. Verificar `?section=info` cambia la sección activa
7. En admin: navegar a `/admin/event-templates` y crear una plantilla de prueba con hitos
8. Volver al dashboard del evento → "Añadir hito" → modal muestra la plantilla creada
9. Añadir un hito → aparece en el timeline
10. Hacer drag & drop de una tarjeta → el orden cambia y persiste al recargar
11. Clicar una tarjeta → panel de detalle aparece abajo
12. Editar y guardar el detalle → cambios persisten
13. Eliminar un hito → desaparece del timeline
