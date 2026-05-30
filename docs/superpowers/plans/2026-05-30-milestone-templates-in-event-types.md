# Milestone Templates in Event Types — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed milestone template management directly into the `/admin/event-types` page so admins can add/delete template milestones per event type without a separate screen.

**Architecture:** Three small changes to existing files + one new API endpoint. The DB utility layer gains two functions. The `event-templates` API is extended to accept `event_type_name` (auto-creates the template implicitly). A new `GET /api/admin/event-types/[id]/milestones` endpoint fetches milestones for a given type. The admin UI adds an expandable row panel per event type (lazy-loaded, cached client-side).

**Tech Stack:** Next.js 14 Pages Router, TypeScript, Tailwind CSS, Neon Postgres (`query` from `@/lib/db`), `verifyAdminSession` from `@/utils/adminAuth`, Zod, `react-hot-toast`, `lucide-react`.

---

## File Structure

| File | Action |
|---|---|
| `src/utils/db/event-templates.ts` | Modify — add `getOrCreateTemplateForEventType` + `getMilestonesByEventTypeName` |
| `src/pages/api/admin/event-types/[id]/milestones.ts` | Create — GET milestones for one event type |
| `src/pages/api/admin/event-templates.ts` | Modify — extend `add_milestone` to accept `event_type_name` |
| `src/pages/admin/event-types.tsx` | Modify — add expandable milestones panel per row |

---

## Task 1: DB utility functions

**Files:**
- Modify: `src/utils/db/event-templates.ts`

- [ ] **Step 1: Add `getOrCreateTemplateForEventType` and `getMilestonesByEventTypeName`**

Append these two functions at the end of `src/utils/db/event-templates.ts`:

```typescript
export async function getOrCreateTemplateForEventType(eventTypeName: string): Promise<EventTemplate> {
  const existing = await query<EventTemplate>(
    `SELECT * FROM event_templates WHERE event_type = $1 LIMIT 1`,
    [eventTypeName]
  );
  if (existing.rows.length) return existing.rows[0];
  const created = await query<EventTemplate>(
    `INSERT INTO event_templates (event_type, name) VALUES ($1, $1) RETURNING *`,
    [eventTypeName]
  );
  return created.rows[0];
}

export async function getMilestonesByEventTypeName(eventTypeName: string): Promise<EventTemplateMilestone[]> {
  const result = await query<EventTemplateMilestone>(
    `SELECT etm.*
     FROM event_template_milestones etm
     JOIN event_templates et ON et.id = etm.template_id
     WHERE et.event_type = $1
     ORDER BY etm.phase, etm.sort_order, etm.id`,
    [eventTypeName]
  );
  return result.rows;
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/db/event-templates.ts
git commit -m "feat: add getOrCreateTemplateForEventType and getMilestonesByEventTypeName"
```

---

## Task 2: GET milestones API endpoint

**Files:**
- Create: `src/pages/api/admin/event-types/[id]/milestones.ts`

Note: `[id].ts` and `[id]/milestones.ts` coexist fine in Next.js Pages Router. The former handles `/api/admin/event-types/123`, the latter handles `/api/admin/event-types/123/milestones`.

- [ ] **Step 1: Create the file**

```typescript
// src/pages/api/admin/event-types/[id]/milestones.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminSession } from '@/utils/adminAuth';
import { query } from '@/lib/db';
import { getMilestonesByEventTypeName } from '@/utils/db/event-templates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await verifyAdminSession(req, res);
  if (!admin) return res.status(401).json({ error: 'No autorizado' });

  const eventTypeId = parseInt(req.query.id as string, 10);
  if (isNaN(eventTypeId)) return res.status(400).json({ error: 'ID inválido' });

  const typeResult = await query<{ name: string }>(
    `SELECT name FROM event_types WHERE id = $1`,
    [eventTypeId]
  );
  if (!typeResult.rows.length) return res.status(404).json({ error: 'Tipo no encontrado' });

  const milestones = await getMilestonesByEventTypeName(typeResult.rows[0].name);
  return res.status(200).json({ milestones });
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/event-types/[id]/milestones.ts
git commit -m "feat: add GET /api/admin/event-types/[id]/milestones endpoint"
```

---

## Task 3: Extend event-templates API for `event_type_name`

**Files:**
- Modify: `src/pages/api/admin/event-templates.ts`

Current `addMilestoneSchema` requires `template_id: z.number().int()`. We need to make `template_id` optional and add optional `event_type_name`, with a refinement ensuring one is present.

- [ ] **Step 1: Update imports**

Add `getOrCreateTemplateForEventType` to the imports from `@/utils/db/event-templates`:

```typescript
import {
  getAllTemplatesWithMilestones,
  createTemplate,
  addMilestoneToTemplate,
  deleteTemplate,
  deleteMilestone,
  getOrCreateTemplateForEventType,
} from '@/utils/db/event-templates';
```

- [ ] **Step 2: Replace `addMilestoneSchema`**

Replace the existing `addMilestoneSchema` constant with:

```typescript
const addMilestoneSchema = z.object({
  template_id: z.number().int().optional(),
  event_type_name: z.string().min(1).max(100).optional(),
  emoji: z.string().max(10).optional().nullable(),
  title: z.string().min(1).max(255),
  hito_type: z.string().min(1).max(50),
  phase: z.enum(['before', 'during', 'after']),
  sort_order: z.number().int().optional().default(0),
}).refine(
  (data) => data.template_id !== undefined || data.event_type_name !== undefined,
  { message: 'Se requiere template_id o event_type_name' }
);
```

- [ ] **Step 3: Replace the `add_milestone` handler block**

Replace the existing `if (action === 'add_milestone')` block with:

```typescript
if (action === 'add_milestone') {
  const parsed = addMilestoneSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  let templateId = parsed.data.template_id;
  if (templateId === undefined) {
    const template = await getOrCreateTemplateForEventType(parsed.data.event_type_name!);
    templateId = template.id;
  }

  const { template_id: _tid, event_type_name: _etn, ...rest } = parsed.data;
  const milestone = await addMilestoneToTemplate(templateId, { ...rest, emoji: rest.emoji ?? null });
  return res.status(201).json({ milestone });
}
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/admin/event-templates.ts
git commit -m "feat: extend add_milestone to accept event_type_name with auto-template creation"
```

---

## Task 4: Admin UI — expandable milestones per event type row

**Files:**
- Modify: `src/pages/admin/event-types.tsx`

- [ ] **Step 1: Add `EventTemplateMilestone` interface and new state**

After the existing `FormData` interface (around line 22), add:

```typescript
interface EventTemplateMilestone {
  id: number;
  template_id: number;
  emoji: string | null;
  title: string;
  hito_type: string;
  phase: 'before' | 'during' | 'after';
  sort_order: number;
}

interface MilestoneForm {
  emoji: string;
  title: string;
  hito_type: string;
  phase: 'before' | 'during' | 'after';
}

const emptyMilestoneForm: MilestoneForm = { emoji: '', title: '', hito_type: '', phase: 'before' };
```

- [ ] **Step 2: Add milestone state inside the component**

After the existing state declarations (after `const [formError, setFormError] = useState('');`), add:

```typescript
const [expandedTypeId, setExpandedTypeId] = useState<number | null>(null);
const [milestonesCache, setMilestonesCache] = useState<Record<number, EventTemplateMilestone[]>>({});
const [loadingMilestones, setLoadingMilestones] = useState<Record<number, boolean>>({});
const [showMilestoneForm, setShowMilestoneForm] = useState<number | null>(null);
const [milestoneForm, setMilestoneForm] = useState<MilestoneForm>(emptyMilestoneForm);
const [savingMilestone, setSavingMilestone] = useState(false);
```

- [ ] **Step 3: Add milestone handler functions**

After the `toggleActive` function, add:

```typescript
const toggleExpand = async (t: EventType) => {
  if (expandedTypeId === t.id) {
    setExpandedTypeId(null);
    setShowMilestoneForm(null);
    return;
  }
  setExpandedTypeId(t.id);
  if (milestonesCache[t.id] !== undefined) return;
  setLoadingMilestones((prev) => ({ ...prev, [t.id]: true }));
  try {
    const res = await fetch(`/api/admin/event-types/${t.id}/milestones`);
    const data = await res.json();
    if (res.ok) setMilestonesCache((prev) => ({ ...prev, [t.id]: data.milestones }));
    else toast.error('Error al cargar hitos');
  } catch { toast.error('Error de conexión'); }
  finally { setLoadingMilestones((prev) => ({ ...prev, [t.id]: false })); }
};

const handleAddMilestone = async (t: EventType) => {
  if (!milestoneForm.title.trim() || !milestoneForm.hito_type.trim()) return;
  setSavingMilestone(true);
  try {
    const res = await fetch('/api/admin/event-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_milestone',
        event_type_name: t.name,
        emoji: milestoneForm.emoji || null,
        title: milestoneForm.title,
        hito_type: milestoneForm.hito_type,
        phase: milestoneForm.phase,
        sort_order: milestonesCache[t.id]?.length ?? 0,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMilestonesCache((prev) => ({ ...prev, [t.id]: [...(prev[t.id] || []), data.milestone] }));
      setMilestoneForm(emptyMilestoneForm);
      setShowMilestoneForm(null);
      toast.success('Hito añadido');
    } else {
      toast.error(data.error || 'Error al añadir hito');
    }
  } catch { toast.error('Error de conexión'); }
  finally { setSavingMilestone(false); }
};

const handleDeleteMilestone = async (typeId: number, milestoneId: number) => {
  if (!confirm('¿Eliminar este hito?')) return;
  try {
    const res = await fetch('/api/admin/event-templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'milestone', id: milestoneId }),
    });
    if (res.ok) {
      setMilestonesCache((prev) => ({
        ...prev,
        [typeId]: (prev[typeId] || []).filter((m) => m.id !== milestoneId),
      }));
      toast.success('Hito eliminado');
    } else {
      toast.error('Error al eliminar hito');
    }
  } catch { toast.error('Error de conexión'); }
};
```

- [ ] **Step 4: Add `ChevronDown` to lucide-react imports**

Update the lucide-react import line from:
```typescript
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
```
to:
```typescript
import { Plus, Pencil, Trash2, X, Check, ChevronDown } from 'lucide-react';
```

- [ ] **Step 5: Update the table body to use React.Fragment with expandable rows**

Add `import React from 'react';` at the top of the file (after the existing imports).

Then, in the `<tbody>` section, replace:
```tsx
{types.map((t) => (
  <tr key={t.id} className={`hover:bg-gray-50 ${!t.active ? 'opacity-50' : ''}`}>
```

With:
```tsx
{types.map((t) => (
  <React.Fragment key={t.id}>
  <tr className={`hover:bg-gray-50 ${!t.active ? 'opacity-50' : ''}`}>
```

And change the closing `</tr>` of each row (at the end of the `types.map` return) to:

```tsx
    </tr>
    {expandedTypeId === t.id && (
      <tr>
        <td colSpan={6} className="px-4 py-4 bg-gray-50 border-b border-gray-200">
          {loadingMilestones[t.id] ? (
            <p className="text-sm text-gray-400 py-2">Cargando hitos...</p>
          ) : (
            <div>
              {/* Milestones list */}
              {(milestonesCache[t.id] || []).length === 0 ? (
                <p className="text-sm text-gray-400 mb-3">Sin hitos de plantilla. Añade el primero.</p>
              ) : (
                <div className="flex flex-col gap-1 mb-3">
                  {(['before', 'during', 'after'] as const).map((phase) => {
                    const phaseMs = (milestonesCache[t.id] || []).filter((m) => m.phase === phase);
                    if (phaseMs.length === 0) return null;
                    const phaseLabel = { before: 'Antes', during: 'Durante', after: 'Después' }[phase];
                    return (
                      <div key={phase} className="mb-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{phaseLabel}</p>
                        <div className="flex flex-wrap gap-2">
                          {phaseMs.map((m) => (
                            <span key={m.id} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700">
                              {m.emoji && <span>{m.emoji}</span>}
                              <span className="font-medium">{m.title}</span>
                              <span className="text-gray-400">·</span>
                              <span className="text-gray-400 font-mono">{m.hito_type}</span>
                              <button
                                onClick={() => handleDeleteMilestone(t.id, m.id)}
                                className="ml-1 text-gray-300 hover:text-red-400 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add form toggle */}
              {showMilestoneForm !== t.id ? (
                <button
                  onClick={() => { setShowMilestoneForm(t.id); setMilestoneForm(emptyMilestoneForm); }}
                  className="text-xs text-primary-600 border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  + Añadir hito
                </button>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-3 mt-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <input
                      placeholder="Emoji"
                      value={milestoneForm.emoji}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, emoji: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <input
                      placeholder="Título *"
                      value={milestoneForm.title}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-32 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <input
                      placeholder="hito_type * (ej: invitations)"
                      value={milestoneForm.hito_type}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, hito_type: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-32 font-mono focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <select
                      value={milestoneForm.phase}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, phase: e.target.value as 'before' | 'during' | 'after' })}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="before">Antes</option>
                      <option value="during">Durante</option>
                      <option value="after">Después</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowMilestoneForm(null)}
                      className="text-xs text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleAddMilestone(t)}
                      disabled={!milestoneForm.title.trim() || !milestoneForm.hito_type.trim() || savingMilestone}
                      className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
                    >
                      {savingMilestone ? '...' : 'Añadir'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </td>
      </tr>
    )}
  </React.Fragment>
))}
```

- [ ] **Step 6: Add the "Hitos" toggle button to the actions cell**

In the actions `<td>` (the last `<td>` of the row, which currently has Pencil and Trash2 buttons), add a ChevronDown button:

```tsx
<td className="px-4 py-3 text-right">
  <button
    onClick={() => toggleExpand(t)}
    title="Hitos de plantilla"
    className={`p-1.5 rounded-lg transition-colors mr-1 ${expandedTypeId === t.id ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'}`}
  >
    <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${expandedTypeId === t.id ? 'rotate-180' : ''}`} />
  </button>
  <button onClick={() => openEdit(t)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
  <button onClick={() => setDeletingType(t)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
</td>
```

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors. If there are errors about React.Fragment, verify `import React from 'react'` is present at the top.

- [ ] **Step 8: Commit**

```bash
git add src/pages/admin/event-types.tsx
git commit -m "feat: add expandable milestone panel per event type in admin"
```

---

## Task 5: Build y deploy

- [ ] **Step 1: Production build**

```bash
cd /Users/edu/claude/happyhub && npm run build 2>&1 | tail -30
```

Expected: build exitoso, sin errores.

- [ ] **Step 2: Push a main**

```bash
cd /Users/edu/claude/happyhub && git push origin main
```

Expected: Vercel despliega automáticamente.

- [ ] **Step 3: Verificación manual**

Ir a `/admin/event-types`. Para cualquier tipo de evento:
1. Click en el botón chevron (▾) → se expande la sección de hitos
2. Click "+ Añadir hito" → aparece el formulario inline
3. Rellenar emoji + título + hito_type + fase → click "Añadir" → hito aparece agrupado por fase
4. Click ✕ en un hito → desaparece
5. Cerrar y volver a expandir el mismo tipo → los hitos están en caché (no recarga)
6. En el dashboard de un evento con ese tipo, click "Añadir hito" en el timeline → los hitos configurados aparecen disponibles

---

## Self-review

**Spec coverage:**
- ✅ Sin cambios de esquema — ninguna migración en el plan
- ✅ Auto-create template en `getOrCreateTemplateForEventType`
- ✅ UI embebida en event-types, sin nueva página
- ✅ GET endpoint para cargar hitos por tipo
- ✅ Extend `add_milestone` para `event_type_name`
- ✅ `/admin/event-templates` sin cambios (queda huérfana)

**Type consistency:**
- `EventTemplateMilestone` definida en Task 4, usada en handlers — consistente
- `MilestoneForm` / `emptyMilestoneForm` — consistente
- `milestonesCache: Record<number, EventTemplateMilestone[]>` — consistente con todos los usos

**No placeholders:** verificado — todo el código es completo.
