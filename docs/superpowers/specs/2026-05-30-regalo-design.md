# Diseño: Sección Regalo + Infraestructura IA — Dashboard Mis Eventos

**Fecha:** 2026-05-30
**Scope:** Bloque 4 del dashboard `/mis-eventos/[id]` — sección `?section=regalo` + capa IA compartida
**Depende de:** Bloques 1-3 ya implementados (shell, timeline, invitados)

---

## Contexto

La sección Regalo reemplaza el placeholder actual en el dashboard. Cubre tres funcionalidades: lista de deseos colaborativa, colecta grupal con enlace externo, y un asesor de regalos con IA que combina Claude Haiku + búsqueda web real (Tavily). La infraestructura IA (`src/lib/ai.ts` + `src/lib/search.ts`) se diseña como capa compartida reutilizable en futuras secciones (Recordatorios, Invitaciones, Música).

---

## Infraestructura IA compartida

### `src/lib/ai.ts`

Wrapper sobre el SDK de Anthropic. Expone una función `generateText` genérica.

```typescript
// Variables de entorno requeridas:
// ANTHROPIC_API_KEY — clave API de Anthropic (pay-per-use, ~€0.001/consulta con Haiku)

export async function generateText(prompt: string, systemPrompt?: string): Promise<string>
```

- Modelo: `claude-haiku-4-5-20251001` (más barato, suficiente para sugerencias)
- Max tokens: 1024
- Sin caché — el volumen de HappyHub no lo justifica
- Si `ANTHROPIC_API_KEY` no está definida, lanza error claro en lugar de fallar silenciosamente

### `src/lib/search.ts`

Wrapper sobre la API de Tavily. Expone `searchWeb` para búsquedas de productos.

```typescript
// Variables de entorno requeridas:
// TAVILY_API_KEY — clave API Tavily (1.000 búsquedas gratuitas/mes)

export async function searchWeb(query: string, maxResults?: number): Promise<TavilyResult[]>

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}
```

- `maxResults` por defecto: 5
- Si `TAVILY_API_KEY` no está definida, retorna array vacío (el asesor funciona sin resultados web, solo con IA)

---

## Base de datos

```sql
-- Migración: 013_regalo_section.sql

-- Lista de deseos: ítems que los invitados pueden reservar
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

-- Colecta grupal: un evento puede tener una colecta activa
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

---

## API endpoints

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/events/collaborative/[id]/regalo` | Lista ítems + fondo (si existe) | sesión |
| POST | `/api/events/collaborative/[id]/regalo/items` | Añadir ítem a la wishlist | sesión |
| DELETE | `/api/events/collaborative/[id]/regalo/items/[itemId]` | Eliminar ítem (solo añadidor u organizador) | sesión |
| POST | `/api/events/collaborative/[id]/regalo/items/[itemId]/reserve` | Reservar/liberar ítem | sesión |
| PUT | `/api/events/collaborative/[id]/regalo/fund` | Crear o actualizar colecta (upsert) | sesión organizador |
| DELETE | `/api/events/collaborative/[id]/regalo/fund` | Eliminar colecta | sesión organizador |
| POST | `/api/events/collaborative/[id]/regalo/suggest` | Asesor IA: devuelve sugerencias | sesión |

### GET `/api/events/collaborative/[id]/regalo`

```typescript
// Response
{
  items: GiftItem[];
  fund: GiftFund | null;
}
```

### POST `.../items`

```typescript
// Body
{ title: string; description?: string; url?: string; price_approx?: number; emoji?: string }
// Inserta con added_by_participant_id = participante actual
```

### POST `.../items/[itemId]/reserve`

```typescript
// Body: {} (toggle — si está libre lo reserva, si está reservado por el mismo usuario lo libera)
// Solo puede liberar quien reservó o el organizador
```

### PUT `.../fund`

```typescript
// Body
{ title: string; description?: string; goal_amount?: number; current_amount?: number; payment_link?: string }
// UPSERT — crea si no existe, actualiza si existe
```

### POST `.../suggest`

```typescript
// Body
{
  personDescription: string;  // "mujer de 35 años, le encanta la fotografía..."
  eventType: string;          // "cumpleaños", "boda", etc.
  budget: string;             // "hasta €30" | "€30–€80" | "€80–€150" | "más de €150"
}

// Lógica:
// 1. Construir query de búsqueda: "regalo [eventType] [keywords de personDescription] [budget]"
// 2. searchWeb(query) → hasta 5 resultados de Tavily
// 3. Construir prompt para Claude con los resultados de búsqueda + contexto
// 4. Claude genera 4-6 sugerencias estructuradas con título, descripción, precio aprox y URL
// Response: { suggestions: GiftSuggestion[] }

interface GiftSuggestion {
  title: string;
  description: string;
  price_approx: string;
  url: string | null;
  emoji: string;
}
```

---

## Componentes

### `GiftSection.tsx` — sección principal del dashboard

**Props:** `{ eventId, isOrganizer, participantId }`

**Estructura:**
```
GiftSection
├── GiftFundCard (si existe fondo, o botón "Crear colecta" para organizador)
├── Cabecera wishlist + botón "Añadir ítem"
├── Lista de GiftItemRow (ítems)
│   ├── Ítem libre → botón Reservar
│   ├── Ítem reservado por mí → botón Liberar
│   └── Ítem reservado por otro → badge "Reservado"
└── Banner asesor IA → abre GiftAdvisor (modal/panel)
```

### `GiftFundCard.tsx`

- Muestra: título, descripción, barra de progreso (current/goal), enlace externo
- El organizador puede editar goal/current_amount manualmente y el payment_link
- Botón "Contribuir" → abre el payment_link en nueva pestaña

### `GiftAdvisor.tsx` — modal del asesor IA

```
GiftAdvisor
├── Formulario: textarea descripción + select tipo fiesta + select presupuesto
├── Botón "Generar ideas" → POST /suggest
├── Estado de carga (spinner)
└── Lista de sugerencias
    ├── Título + emoji + precio + descripción
    ├── Enlace externo
    └── Botón "+ Añadir a lista" → POST /items (pre-rellena formulario)
```

---

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `database/migrations/013_regalo_section.sql` | Crear |
| `src/lib/ai.ts` | Crear (wrapper Anthropic) |
| `src/lib/search.ts` | Crear (wrapper Tavily) |
| `src/pages/api/events/collaborative/[id]/regalo/index.ts` | Crear (GET) |
| `src/pages/api/events/collaborative/[id]/regalo/items.ts` | Crear (POST) |
| `src/pages/api/events/collaborative/[id]/regalo/items/[itemId].ts` | Crear (DELETE) |
| `src/pages/api/events/collaborative/[id]/regalo/items/[itemId]/reserve.ts` | Crear (POST toggle) |
| `src/pages/api/events/collaborative/[id]/regalo/fund.ts` | Crear (PUT + DELETE) |
| `src/pages/api/events/collaborative/[id]/regalo/suggest.ts` | Crear (POST IA) |
| `src/components/events/GiftSection.tsx` | Crear |
| `src/components/events/GiftFundCard.tsx` | Crear |
| `src/components/events/GiftAdvisor.tsx` | Crear |
| `src/pages/mis-eventos/[id].tsx` | Modificar (conectar sección regalo) |

---

## Variables de entorno necesarias

```bash
ANTHROPIC_API_KEY=sk-ant-...   # Anthropic API (pay-per-use, ~€0.001/consulta Haiku)
TAVILY_API_KEY=tvly-...        # Tavily Search (1.000 búsquedas gratuitas/mes)
```

Añadir a `.env.local` (dev) y a Vercel Console (producción).

---

## Lo que NO entra en este spec

- Pago integrado de colecta (Stripe Connect) — queda para una iteración futura
- Moderación de ítems añadidos por invitados (todos se publican directamente)
- Historial de reservas / notificaciones cuando alguien reserva
- Caché de respuestas IA (no necesario a esta escala)
