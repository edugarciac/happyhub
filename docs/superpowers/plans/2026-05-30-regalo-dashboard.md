# Regalo Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Regalo section of `/mis-eventos/[id]` dashboard: collaborative wishlist, group fund with external payment link, and an AI gift advisor powered by Claude Haiku + Tavily web search.

**Architecture:** Two new DB tables (`event_gift_items`, `event_gift_fund`). Shared AI layer (`src/lib/ai.ts` + `src/lib/search.ts`) using the already-installed `@anthropic-ai/sdk` and Tavily API via fetch. Six API routes following the existing pattern (`getServerSession` + `getCollaborativeEventById` + `getParticipantByUserId` + `query`). Three React components: `GiftFundCard`, `GiftAdvisor`, `GiftSection`.

**Tech Stack:** Next.js 14 Pages Router, TypeScript, Tailwind CSS, Neon Postgres (`query` from `@/lib/db`), `@anthropic-ai/sdk` (already installed ^0.78.0), Tavily REST API (fetch), Zod.

---

## File Structure

| File | Role |
|---|---|
| `database/migrations/013_regalo_section.sql` | Create event_gift_items + event_gift_fund tables |
| `src/lib/ai.ts` | Anthropic API wrapper — `generateText(prompt, systemPrompt?)` |
| `src/lib/search.ts` | Tavily search wrapper — `searchWeb(query, maxResults?)` |
| `src/pages/api/events/collaborative/[id]/regalo/index.ts` | GET items + fund |
| `src/pages/api/events/collaborative/[id]/regalo/items.ts` | POST add item |
| `src/pages/api/events/collaborative/[id]/regalo/items/[itemId].ts` | DELETE item |
| `src/pages/api/events/collaborative/[id]/regalo/items/[itemId]/reserve.ts` | POST toggle reserve |
| `src/pages/api/events/collaborative/[id]/regalo/fund.ts` | PUT upsert + DELETE fund |
| `src/pages/api/events/collaborative/[id]/regalo/suggest.ts` | POST AI suggestions |
| `src/components/events/GiftFundCard.tsx` | Colecta card with progress bar and inline edit |
| `src/components/events/GiftAdvisor.tsx` | AI advisor modal |
| `src/components/events/GiftSection.tsx` | Main section: wishlist + fund + advisor CTA |
| `src/pages/mis-eventos/[id].tsx` | Add `currentParticipantId` prop + wire regalo case |

---

## Task 1: Migración de base de datos

**Files:**
- Create: `database/migrations/013_regalo_section.sql`

- [ ] **Step 1: Crear el archivo de migración**

```sql
-- database/migrations/013_regalo_section.sql
CREATE TABLE IF NOT EXISTS event_gift_items (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  price_approx NUMERIC(10,2),
  emoji VARCHAR(10),
  added_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  reserved_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  reserved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_gift_fund (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL UNIQUE REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  goal_amount NUMERIC(10,2),
  current_amount NUMERIC(10,2) DEFAULT 0,
  payment_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gift_items_event ON event_gift_items(event_id);
```

- [ ] **Step 2: Aplicar en Neon**

```bash
node -e "
const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
client.connect()
  .then(() => client.query(fs.readFileSync('database/migrations/013_regalo_section.sql', 'utf8')))
  .then(() => { console.log('OK'); client.end(); })
  .catch(e => { console.error(e.message); client.end(); });
"
```

Expected: `OK`

- [ ] **Step 3: Verificar tablas**

```bash
node -e "
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
client.connect()
  .then(() => client.query(\"SELECT table_name FROM information_schema.tables WHERE table_name IN ('event_gift_items','event_gift_fund')\"))
  .then(r => { console.log(r.rows.map(x => x.table_name)); client.end(); });
"
```

Expected: `[ 'event_gift_items', 'event_gift_fund' ]`

- [ ] **Step 4: Commit**

```bash
git add database/migrations/013_regalo_section.sql
git commit -m "feat: add event_gift_items and event_gift_fund tables"
```

---

## Task 2: Infraestructura IA compartida

**Files:**
- Create: `src/lib/ai.ts`
- Create: `src/lib/search.ts`

- [ ] **Step 1: Crear `src/lib/ai.ts`**

```typescript
// src/lib/ai.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no está configurada');
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Tipo de respuesta inesperado de la IA');
  return content.text;
}
```

- [ ] **Step 2: Crear `src/lib/search.ts`**

```typescript
// src/lib/search.ts
export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function searchWeb(query: string, maxResults = 5): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        search_depth: 'basic',
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    }));
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai.ts src/lib/search.ts
git commit -m "feat: add shared AI (Anthropic Haiku) and web search (Tavily) lib"
```

---

## Task 3: API — GET regalo + POST/DELETE items

**Files:**
- Create: `src/pages/api/events/collaborative/[id]/regalo/index.ts`
- Create: `src/pages/api/events/collaborative/[id]/regalo/items.ts`
- Create: `src/pages/api/events/collaborative/[id]/regalo/items/[itemId].ts`

- [ ] **Step 1: Crear `regalo/index.ts` (GET)**

```typescript
// src/pages/api/events/collaborative/[id]/regalo/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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

  const [itemsResult, fundResult] = await Promise.all([
    query(`SELECT * FROM event_gift_items WHERE event_id = $1 ORDER BY created_at ASC`, [eventId]),
    query(`SELECT * FROM event_gift_fund WHERE event_id = $1`, [eventId]),
  ]);

  return res.status(200).json({
    items: itemsResult.rows,
    fund: fundResult.rows[0] || null,
  });
}
```

- [ ] **Step 2: Crear `regalo/items.ts` (POST añadir ítem)**

```typescript
// src/pages/api/events/collaborative/[id]/regalo/items.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

const addItemSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(500).optional().nullable(),
  url: z.string().url().max(500).optional().nullable(),
  price_approx: z.number().positive().optional().nullable(),
  emoji: z.string().max(10).optional().nullable(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, description, url, price_approx, emoji } = parsed.data;

  const result = await query(
    `INSERT INTO event_gift_items (event_id, title, description, url, price_approx, emoji, added_by_participant_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [eventId, title, description ?? null, url ?? null, price_approx ?? null, emoji ?? null, participant?.id ?? null]
  );

  return res.status(201).json({ item: result.rows[0] });
}
```

- [ ] **Step 3: Crear `regalo/items/[itemId].ts` (DELETE)**

```typescript
// src/pages/api/events/collaborative/[id]/regalo/items/[itemId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const itemId = parseInt(req.query.itemId as string, 10);
  if (isNaN(eventId) || isNaN(itemId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;

  const itemResult = await query(
    `SELECT * FROM event_gift_items WHERE id = $1 AND event_id = $2`,
    [itemId, eventId]
  );
  const item = itemResult.rows[0];
  if (!item) return res.status(404).json({ error: 'Ítem no encontrado' });

  const isAdder = participant && item.added_by_participant_id === participant.id;
  if (!isAdder && !isOrganizer) return res.status(403).json({ error: 'Sin permisos para eliminar este ítem' });

  await query(`DELETE FROM event_gift_items WHERE id = $1`, [itemId]);
  return res.status(200).json({ deleted: true });
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
git commit -m "feat: add regalo GET index + POST/DELETE items API"
```

---

## Task 4: API — Reserve toggle + Fund upsert/delete

**Files:**
- Create: `src/pages/api/events/collaborative/[id]/regalo/items/[itemId]/reserve.ts`
- Create: `src/pages/api/events/collaborative/[id]/regalo/fund.ts`

- [ ] **Step 1: Crear `items/[itemId]/reserve.ts` (POST toggle)**

```typescript
// src/pages/api/events/collaborative/[id]/regalo/items/[itemId]/reserve.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const itemId = parseInt(req.query.itemId as string, 10);
  if (isNaN(eventId) || isNaN(itemId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  const itemResult = await query(
    `SELECT * FROM event_gift_items WHERE id = $1 AND event_id = $2`,
    [itemId, eventId]
  );
  const item = itemResult.rows[0];
  if (!item) return res.status(404).json({ error: 'Ítem no encontrado' });

  if (item.reserved_by_participant_id !== null) {
    // Ya reservado — solo puede liberar quien lo reservó o el organizador
    const isReserver = participant && item.reserved_by_participant_id === participant.id;
    if (!isReserver && !isOrganizer) {
      return res.status(403).json({ error: 'Este ítem ya está reservado por otro invitado' });
    }
    const result = await query(
      `UPDATE event_gift_items SET reserved_by_participant_id = NULL, reserved_at = NULL WHERE id = $1 RETURNING *`,
      [itemId]
    );
    return res.status(200).json({ item: result.rows[0], action: 'released' });
  } else {
    // Libre — cualquier participante puede reservar
    const result = await query(
      `UPDATE event_gift_items SET reserved_by_participant_id = $1, reserved_at = NOW() WHERE id = $2 RETURNING *`,
      [participant?.id ?? null, itemId]
    );
    return res.status(200).json({ item: result.rows[0], action: 'reserved' });
  }
}
```

- [ ] **Step 2: Crear `regalo/fund.ts` (PUT upsert + DELETE)**

```typescript
// src/pages/api/events/collaborative/[id]/regalo/fund.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';

const fundSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(500).optional().nullable(),
  goal_amount: z.number().positive().optional().nullable(),
  current_amount: z.number().min(0).optional().nullable(),
  payment_link: z.string().url().max(500).optional().nullable(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.organizer_id !== userId) {
    return res.status(403).json({ error: 'Solo el organizador puede gestionar la colecta' });
  }

  if (req.method === 'PUT') {
    const parsed = fundSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { title, description, goal_amount, current_amount, payment_link } = parsed.data;

    const result = await query(
      `INSERT INTO event_gift_fund (event_id, title, description, goal_amount, current_amount, payment_link)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (event_id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         goal_amount = EXCLUDED.goal_amount,
         current_amount = EXCLUDED.current_amount,
         payment_link = EXCLUDED.payment_link,
         updated_at = NOW()
       RETURNING *`,
      [eventId, title, description ?? null, goal_amount ?? null, current_amount ?? 0, payment_link ?? null]
    );
    return res.status(200).json({ fund: result.rows[0] });
  }

  if (req.method === 'DELETE') {
    await query(`DELETE FROM event_gift_fund WHERE event_id = $1`, [eventId]);
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/events/collaborative/
git commit -m "feat: add reserve toggle and gift fund upsert/delete API"
```

---

## Task 5: API — Asesor IA (suggest)

**Files:**
- Create: `src/pages/api/events/collaborative/[id]/regalo/suggest.ts`

- [ ] **Step 1: Crear `regalo/suggest.ts`**

```typescript
// src/pages/api/events/collaborative/[id]/regalo/suggest.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';
import { generateText } from '@/lib/ai';
import { searchWeb } from '@/lib/search';

const suggestSchema = z.object({
  personDescription: z.string().min(1).max(500),
  eventType: z.string().min(1).max(100),
  budget: z.string().min(1).max(50),
});

interface GiftSuggestion {
  title: string;
  description: string;
  price_approx: string;
  url: string | null;
  emoji: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  const parsed = suggestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { personDescription, eventType, budget } = parsed.data;

  // Step 1: Buscar productos reales en la web
  const searchQuery = `ideas regalo ${eventType} ${personDescription} presupuesto ${budget}`;
  const webResults = await searchWeb(searchQuery, 5);

  const webContext = webResults.length > 0
    ? webResults.map((r, i) => `${i + 1}. ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 200)}`).join('\n\n')
    : 'No hay resultados de búsqueda disponibles.';

  // Step 2: Claude genera sugerencias estructuradas
  const systemPrompt = `Eres un asesor de regalos experto para eventos sociales españoles. Generas ideas de regalos personalizadas, prácticas y culturalmente apropiadas. Respondes SIEMPRE en JSON válido con este formato exacto:
{"suggestions":[{"title":"string","description":"string","price_approx":"string","url":"string|null","emoji":"string"}]}
Genera entre 4 y 6 sugerencias. El emoji debe ser relevante al regalo. La descripción es breve (1-2 frases en español). price_approx es una cadena como "~€45" o "€80–€120". Para url: usa solo las URLs de los resultados de búsqueda que sean realmente relevantes; si no hay ninguna relevante, usa null.`;

  const userPrompt = `Tipo de evento: ${eventType}
Persona: ${personDescription}
Presupuesto: ${budget}

Resultados de búsqueda web disponibles:
${webContext}

Genera sugerencias de regalo personalizadas y variadas.`;

  try {
    const aiResponse = await generateText(userPrompt, systemPrompt);
    // Claude puede envolver el JSON en bloques de código markdown
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Respuesta IA inválida' });

    const result = JSON.parse(jsonMatch[0]) as { suggestions: GiftSuggestion[] };
    return res.status(200).json({ suggestions: result.suggestions });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error generando sugerencias: ' + err.message });
  }
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/events/collaborative/
git commit -m "feat: add AI gift advisor suggest API (Claude Haiku + Tavily)"
```

---

## Task 6: Componente GiftFundCard

**Files:**
- Create: `src/components/events/GiftFundCard.tsx`

- [ ] **Step 1: Crear `GiftFundCard.tsx`**

```typescript
// src/components/events/GiftFundCard.tsx
import { useState } from 'react';

interface GiftFund {
  id: number;
  title: string;
  description: string | null;
  goal_amount: number | null;
  current_amount: number;
  payment_link: string | null;
}

interface GiftFundCardProps {
  eventId: number;
  fund: GiftFund | null;
  isOrganizer: boolean;
  onUpdated: (fund: GiftFund | null) => void;
}

interface FundForm {
  title: string;
  description: string;
  goal_amount: string;
  current_amount: string;
  payment_link: string;
}

export default function GiftFundCard({ eventId, fund, isOrganizer, onUpdated }: GiftFundCardProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FundForm>({
    title: fund?.title || '',
    description: fund?.description || '',
    goal_amount: fund?.goal_amount?.toString() || '',
    current_amount: fund?.current_amount?.toString() || '0',
    payment_link: fund?.payment_link || '',
  });

  const progressPct = fund?.goal_amount && fund.goal_amount > 0
    ? Math.min(100, Math.round((fund.current_amount / fund.goal_amount) * 100))
    : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/regalo/fund`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          goal_amount: form.goal_amount ? parseFloat(form.goal_amount) : null,
          current_amount: form.current_amount ? parseFloat(form.current_amount) : 0,
          payment_link: form.payment_link || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdated(data.fund);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar la colecta?')) return;
    const res = await fetch(`/api/events/collaborative/${eventId}/regalo/fund`, { method: 'DELETE' });
    if (res.ok) onUpdated(null);
  };

  if (!fund && !isOrganizer) return null;

  if (!fund && isOrganizer) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full border-2 border-dashed border-green-300 rounded-xl p-4 text-center text-green-600 hover:bg-green-50 transition-colors text-sm font-semibold mb-5"
      >
        + Crear colecta grupal
      </button>
    );
  }

  if (editing || (!fund && isOrganizer)) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
        <h3 className="font-bold text-green-800 text-sm mb-3">💰 {fund ? 'Editar colecta' : 'Nueva colecta'}</h3>
        <div className="flex flex-col gap-2">
          <input
            placeholder="Título *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <div className="flex gap-2">
            <input
              placeholder="Objetivo €"
              type="number"
              value={form.goal_amount}
              onChange={(e) => setForm({ ...form, goal_amount: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <input
              placeholder="Recaudado €"
              type="number"
              value={form.current_amount}
              onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <input
            placeholder="Enlace de pago (Bizum, PayPal, Revolut...)"
            value={form.payment_link}
            onChange={(e) => setForm({ ...form, payment_link: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <div className="flex gap-2 justify-end mt-1">
            {fund && (
              <button onClick={handleDelete} className="text-sm text-red-400 hover:text-red-600 px-3 py-1.5">
                Eliminar
              </button>
            )}
            <button onClick={() => setEditing(false)} className="text-sm text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || saving}
              className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-green-800 text-sm">💰 {fund!.title}</div>
          {fund!.description && <div className="text-green-700 text-xs mt-0.5">{fund!.description}</div>}
        </div>
        <div className="text-right">
          <div className="font-bold text-green-800 text-base">
            €{fund!.current_amount}
            {fund!.goal_amount && <span className="text-green-500 text-xs font-normal"> de €{fund!.goal_amount}</span>}
          </div>
        </div>
      </div>

      {progressPct !== null && (
        <div className="bg-green-200 rounded-full h-2 mb-3">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-green-700">
          {fund!.payment_link
            ? <span className="truncate max-w-[180px] block">{fund!.payment_link}</span>
            : <span className="text-green-400 italic">Sin enlace de pago</span>}
        </div>
        <div className="flex gap-2">
          {isOrganizer && (
            <button
              onClick={() => { setForm({ title: fund!.title, description: fund!.description || '', goal_amount: fund!.goal_amount?.toString() || '', current_amount: fund!.current_amount.toString(), payment_link: fund!.payment_link || '' }); setEditing(true); }}
              className="text-xs text-green-600 border border-green-300 px-2.5 py-1 rounded-lg hover:bg-green-100"
            >
              Editar
            </button>
          )}
          {fund!.payment_link && (
            <a
              href={fund!.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-green-700"
            >
              Contribuir →
            </a>
          )}
        </div>
      </div>
    </div>
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
git add src/components/events/GiftFundCard.tsx
git commit -m "feat: add GiftFundCard component with progress bar and inline edit"
```

---

## Task 7: Componente GiftAdvisor

**Files:**
- Create: `src/components/events/GiftAdvisor.tsx`

- [ ] **Step 1: Crear `GiftAdvisor.tsx`**

```typescript
// src/components/events/GiftAdvisor.tsx
import { useState } from 'react';

interface GiftSuggestion {
  title: string;
  description: string;
  price_approx: string;
  url: string | null;
  emoji: string;
}

interface GiftAdvisorProps {
  eventId: number;
  eventType: string | null;
  onAddToList: (item: { title: string; description: string; url: string | null; price_approx: number | null; emoji: string }) => Promise<void>;
  onClose: () => void;
}

const BUDGET_OPTIONS = ['Hasta €30', '€30–€80', '€80–€150', 'Más de €150'];

const EVENT_TYPE_OPTIONS = [
  '🎂 Cumpleaños',
  '💍 Boda',
  '🎓 Graduación',
  '🎄 Navidad',
  '👶 Baby shower',
  '🏠 Inauguración',
  '❤️ San Valentín',
  'Otro',
];

export default function GiftAdvisor({ eventId, eventType, onAddToList, onClose }: GiftAdvisorProps) {
  const [personDescription, setPersonDescription] = useState('');
  const [selectedEventType, setSelectedEventType] = useState(
    eventType ? EVENT_TYPE_OPTIONS.find((o) => o.toLowerCase().includes(eventType.toLowerCase())) || EVENT_TYPE_OPTIONS[0]
    : EVENT_TYPE_OPTIONS[0]
  );
  const [budget, setBudget] = useState(BUDGET_OPTIONS[1]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!personDescription.trim()) return;
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/regalo/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personDescription, eventType: selectedEventType, budget }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al generar sugerencias'); return; }
      setSuggestions(data.suggestions);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (suggestion: GiftSuggestion, index: number) => {
    setAddingIndex(index);
    try {
      const priceMatch = suggestion.price_approx.match(/[\d,.]+/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : null;
      await onAddToList({
        title: suggestion.title,
        description: suggestion.description,
        url: suggestion.url,
        price_approx: price,
        emoji: suggestion.emoji,
      });
    } finally {
      setAddingIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-white font-bold text-lg">✨ Asesor de regalos IA</h2>
            <p className="text-violet-200 text-xs mt-0.5">Describe a la persona y genera ideas con enlaces reales</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-5">
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">¿Para quién es el regalo? *</label>
            <textarea
              value={personDescription}
              onChange={(e) => setPersonDescription(e.target.value)}
              placeholder="Ej: mujer de 35 años, le encanta la fotografía y el yoga, viaja mucho"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de evento</label>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Presupuesto</label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {BUDGET_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!personDescription.trim() || loading}
            className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors mb-4"
          >
            {loading ? '✨ Generando ideas...' : '✨ Generar ideas'}
          </button>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          {suggestions.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ideas generadas</p>
              <div className="flex flex-col gap-3">
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-violet-50 border border-violet-100 rounded-xl p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm text-gray-900">{s.emoji} {s.title}</span>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{s.price_approx}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{s.description}</p>
                    <div className="flex gap-2">
                      {s.url && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-600 border border-violet-200 px-2.5 py-1 rounded-lg hover:bg-violet-100"
                        >
                          Ver →
                        </a>
                      )}
                      <button
                        onClick={() => handleAdd(s, i)}
                        disabled={addingIndex === i}
                        className="text-xs bg-violet-600 text-white px-2.5 py-1 rounded-lg hover:bg-violet-700 disabled:opacity-50"
                      >
                        {addingIndex === i ? '...' : '+ Añadir a lista'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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
git add src/components/events/GiftAdvisor.tsx
git commit -m "feat: add GiftAdvisor modal component with AI suggestions"
```

---

## Task 8: Componente GiftSection

**Files:**
- Create: `src/components/events/GiftSection.tsx`

- [ ] **Step 1: Crear `GiftSection.tsx`**

```typescript
// src/components/events/GiftSection.tsx
import { useState, useEffect, useCallback } from 'react';
import GiftFundCard from './GiftFundCard';
import GiftAdvisor from './GiftAdvisor';

interface GiftItem {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  price_approx: number | null;
  emoji: string | null;
  added_by_participant_id: number | null;
  reserved_by_participant_id: number | null;
  reserved_at: string | null;
}

interface GiftFund {
  id: number;
  title: string;
  description: string | null;
  goal_amount: number | null;
  current_amount: number;
  payment_link: string | null;
}

interface GiftSectionProps {
  eventId: number;
  isOrganizer: boolean;
  currentParticipantId: number | null;
  eventType: string | null;
}

export default function GiftSection({ eventId, isOrganizer, currentParticipantId, eventType }: GiftSectionProps) {
  const [items, setItems] = useState<GiftItem[]>([]);
  const [fund, setFund] = useState<GiftFund | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', description: '', url: '', price_approx: '', emoji: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [reservingId, setReservingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/events/collaborative/${eventId}/regalo`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setFund(data.fund);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddItem = async (itemData?: { title: string; description: string; url: string | null; price_approx: number | null; emoji: string }) => {
    const payload = itemData || {
      title: addForm.title,
      description: addForm.description || null,
      url: addForm.url || null,
      price_approx: addForm.price_approx ? parseFloat(addForm.price_approx) : null,
      emoji: addForm.emoji || null,
    };
    if (!payload.title.trim()) return;

    setAddingItem(true);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/regalo/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => [...prev, data.item]);
        setAddForm({ title: '', description: '', url: '', price_approx: '', emoji: '' });
        setShowAddForm(false);
      }
    } finally {
      setAddingItem(false);
    }
  };

  const handleReserve = async (itemId: number) => {
    setReservingId(itemId);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/regalo/items/${itemId}/reserve`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => prev.map((i) => i.id === itemId ? data.item : i));
      }
    } finally {
      setReservingId(null);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('¿Eliminar este ítem?')) return;
    const res = await fetch(`/api/events/collaborative/${eventId}/regalo/items/${itemId}`, { method: 'DELETE' });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const getReserveState = (item: GiftItem) => {
    if (item.reserved_by_participant_id === null) return 'free';
    if (item.reserved_by_participant_id === currentParticipantId) return 'mine';
    return 'other';
  };

  if (loading) return <p className="text-gray-400 text-sm text-center py-12">Cargando...</p>;

  return (
    <div className="max-w-3xl">
      {/* Colecta */}
      <GiftFundCard
        eventId={eventId}
        fund={fund}
        isOrganizer={isOrganizer}
        onUpdated={setFund}
      />

      {/* Wishlist header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-900 text-sm">
          🛍️ Lista de deseos
          <span className="text-gray-400 font-normal ml-1.5 text-xs">
            ({items.length} ítem{items.length !== 1 ? 's' : ''}{items.filter(i => i.reserved_by_participant_id).length > 0 ? ` · ${items.filter(i => i.reserved_by_participant_id).length} reservado${items.filter(i => i.reserved_by_participant_id).length !== 1 ? 's' : ''}` : ''})
          </span>
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 font-semibold"
        >
          + Añadir
        </button>
      </div>

      {/* Add item form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex gap-2 mb-2">
            <input
              placeholder="Emoji (opcional)"
              value={addForm.emoji}
              onChange={(e) => setAddForm({ ...addForm, emoji: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              placeholder="Nombre del regalo *"
              value={addForm.title}
              onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              placeholder="Precio ~€"
              type="number"
              value={addForm.price_approx}
              onChange={(e) => setAddForm({ ...addForm, price_approx: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <input
            placeholder="Enlace (opcional)"
            value={addForm.url}
            onChange={(e) => setAddForm({ ...addForm, url: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full mb-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddForm(false)} className="text-sm text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button
              onClick={() => handleAddItem()}
              disabled={!addForm.title.trim() || addingItem}
              className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
            >
              {addingItem ? '...' : 'Añadir'}
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8 bg-gray-50 rounded-xl">
          Sin ítems aún. Añade el primero o usa el asesor IA.
        </p>
      ) : (
        <div className="flex flex-col gap-2 mb-5">
          {items.map((item) => {
            const reserveState = getReserveState(item);
            const canDelete = isOrganizer || item.added_by_participant_id === currentParticipantId;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 ${reserveState === 'other' ? 'opacity-60' : 'border-gray-200'}`}
              >
                <span className="text-xl flex-shrink-0">{item.emoji || '🎁'}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${reserveState === 'other' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-400 flex gap-2 mt-0.5">
                    {item.price_approx && <span>~€{item.price_approx}</span>}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline truncate max-w-[160px]">
                        {new URL(item.url).hostname}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {reserveState === 'free' && (
                    <button
                      onClick={() => handleReserve(item.id)}
                      disabled={reservingId === item.id}
                      className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 disabled:opacity-50 font-semibold"
                    >
                      {reservingId === item.id ? '...' : 'Reservar'}
                    </button>
                  )}
                  {reserveState === 'mine' && (
                    <button
                      onClick={() => handleReserve(item.id)}
                      disabled={reservingId === item.id}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 disabled:opacity-50 font-semibold"
                    >
                      {reservingId === item.id ? '...' : '✓ Reservado'}
                    </button>
                  )}
                  {reserveState === 'other' && (
                    <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg font-semibold">
                      Reservado
                    </span>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-300 hover:text-red-400 p-1 transition-colors"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Advisor CTA */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">✨</span>
        <div className="flex-1">
          <p className="font-bold text-violet-700 text-sm">Asesor de regalos IA</p>
          <p className="text-violet-500 text-xs">Describe a la persona y te sugiero ideas con enlaces reales</p>
        </div>
        <button
          onClick={() => setShowAdvisor(true)}
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 flex-shrink-0"
        >
          Abrir →
        </button>
      </div>

      {/* AI Advisor Modal */}
      {showAdvisor && (
        <GiftAdvisor
          eventId={eventId}
          eventType={eventType}
          onAddToList={handleAddItem}
          onClose={() => setShowAdvisor(false)}
        />
      )}
    </div>
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
git add src/components/events/GiftSection.tsx
git commit -m "feat: add GiftSection component with wishlist, fund, and AI advisor CTA"
```

---

## Task 9: Conectar al dashboard

**Files:**
- Modify: `src/pages/mis-eventos/[id].tsx`

- [ ] **Step 1: Leer el archivo actual**

Leer `src/pages/mis-eventos/[id].tsx` para confirmar la estructura de Props y getServerSideProps.

- [ ] **Step 2: Añadir `currentParticipantId` a las Props**

Añadir `currentParticipantId: number | null` a la interfaz Props:

```typescript
interface Props {
  event: CollaborativeEvent;
  participants: CollaborativeEventParticipant[];
  milestones: CollaborativeEventTimeline[];
  isOrganizer: boolean;
  currentParticipantId: number | null;
  section: string;
}
```

- [ ] **Step 3: Calcular y pasar `currentParticipantId` en getServerSideProps**

En `getServerSideProps`, `participant` ya se calcula con `getParticipantByUserId`. Añadir al return:

```typescript
return {
  props: {
    event: JSON.parse(JSON.stringify(event)),
    participants: JSON.parse(JSON.stringify(participants)),
    milestones: JSON.parse(JSON.stringify(milestones)),
    isOrganizer,
    currentParticipantId: participant?.id ?? null,
    section,
  },
};
```

- [ ] **Step 4: Añadir import de GiftSection y conectar el case**

Añadir al bloque de imports (junto a GuestList):

```typescript
import GiftSection from '@/components/events/GiftSection';
```

Reemplazar el case `'regalo'`:

```typescript
case 'regalo':
  return (
    <GiftSection
      eventId={event.id}
      isOrganizer={isOrganizer}
      currentParticipantId={currentParticipantId}
      eventType={event.category}
    />
  );
```

Actualizar también la firma del componente para incluir `currentParticipantId`:

```typescript
export default function MisEventosDashboard({ event, participants, milestones, isOrganizer, currentParticipantId, section }: Props) {
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/pages/mis-eventos/[id].tsx
git commit -m "feat: connect GiftSection to dashboard, add currentParticipantId prop"
```

---

## Task 10: Build y deploy

- [ ] **Step 1: Build de producción**

```bash
npm run build 2>&1 | tail -30
```

Expected: build exitoso. Páginas generadas sin errores.

Si hay errores de TypeScript o build, revisarlos y corregirlos antes de continuar.

- [ ] **Step 2: Verificar variables de entorno en Vercel**

Antes de hacer push, asegurarse de que las siguientes variables están configuradas en Vercel Console → Settings → Environment Variables:

```
ANTHROPIC_API_KEY    — clave de console.anthropic.com
TAVILY_API_KEY       — clave de tavily.com (free tier: 1.000 búsquedas/mes)
```

Si no están configuradas, el asesor IA devolverá error pero el resto de la sección (wishlist + colecta) funcionará.

- [ ] **Step 3: Push a main**

```bash
git push origin main
```

Expected: Vercel despliega automáticamente.

- [ ] **Step 4: Verificar en local antes del push**

```bash
npm run dev
```

Flujo mínimo a verificar:
1. Abrir `/mis-eventos/[id]?section=regalo` con un evento existente
2. Crear una colecta → aparece con barra de progreso
3. Añadir un ítem manualmente → aparece en la lista
4. Reservar un ítem → cambia a "✓ Reservado"
5. Abrir el asesor IA → introducir descripción → generar ideas (requiere ANTHROPIC_API_KEY en .env.local)
6. Clicar "+ Añadir a lista" desde el asesor → el ítem aparece en la wishlist
