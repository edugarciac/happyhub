## Why

Las dudas de los clientes (horarios, qué incluye, cancelación, cómo llegar, uso de la sala) llegan por WhatsApp y se responden a mano. La información ya existe en la FAQ de `/como-funciona`, pero está escrita dentro del componente, así que solo la puede editar un desarrollador y no se puede reutilizar. Un chatbot que responda con esa misma información (y con precio y disponibilidad reales de la BD) resuelve las preguntas repetidas a cualquier hora y deja WhatsApp para lo que de verdad necesita a una persona.

## What Changes

- **Una sola base de conocimiento en Markdown** (`content/kb/`) que fusiona la FAQ de `/como-funciona` y la guía de la sala: cada pregunta existe una sola vez y cada documento indica en qué páginas aparece.
- **Estructura navegable**: páginas principales (hubs) con enlaces a páginas de detalle, y una sección **Operaciones** con un listado de operaciones concretas (p. ej. "Encender sala") que siguen una plantilla común.
- **Punto de partida: el panel de control** de la sala, que agrupa las funcionalidades por tipología y los botones de acciones agrupadas.
- **Páginas leen los `.md` en build**: `/como-funciona`, `/guia-sala` y `/guia-sala/<slug>` usan `getStaticProps`/`getStaticPaths`. Se elimina la FAQ escrita en `src/pages/como-funciona.tsx`.
- **`POST /api/chat`** con `@anthropic-ai/sdk` (sobre `src/lib/ai.ts`):
  - Los `.md` completos van en el prompt de sistema (son pocos; no hace falta RAG).
  - Precio y disponibilidad salen de herramientas que consultan la BD (misma lógica que `/api/pricing/current` y `/api/booked-slots`), nunca de los `.md`.
  - Si no sabe la respuesta, deriva a WhatsApp (`CONTACT_INFO.whatsapp`).
- **Widget de chat** en la web pública y en `/guia-sala/panel`.
- **WhatsApp** como canal del chatbot queda para una fase posterior.

## Capabilities

### New Capabilities

- `knowledge-base`: contenido de FAQ y guía de la sala en `content/kb/*.md`, leído en build
- `kb-chatbot`: endpoint `/api/chat`, herramientas de precio/disponibilidad y widget

## Impact

- **Contenido**: nuevo `content/kb/` (hubs, detalle, `operaciones/`)
- **Backend**: nuevo `src/lib/kb.ts` (lector de `.md`), `src/pages/api/chat.ts`; extraer la consulta de precios y de huecos ocupados a funciones de `src/lib/` reutilizables por la API actual y el chatbot
- **Frontend**: `src/pages/como-funciona.tsx`, nuevas `src/pages/guia-sala/index.tsx`, `src/pages/guia-sala/[...slug].tsx` y `src/pages/guia-sala/panel.tsx`, nuevo `src/components/ChatWidget.tsx`
- **Dependencias**: `gray-matter` (frontmatter); render de Markdown (`marked` o `react-markdown`)
- **Entorno**: usa `ANTHROPIC_API_KEY` ya existente
- **Coste**: llamadas a la API de Claude por cada mensaje; se limita con rate limit y tope de longitud
