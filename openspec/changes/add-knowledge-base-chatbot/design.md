## Context

- La FAQ vive hoy como un array `categories` dentro de `src/pages/como-funciona.tsx` (4 categorías). **No existen** `src/data/faqs.ts`, `src/data/guiaSala.ts`, `/guia-sala` ni `/guia-sala/panel`: este cambio los crea a partir de `content/kb/`.
- `src/lib/ai.ts` ya instancia el cliente de Anthropic (`generateText`, sin herramientas).
- Precios: tabla `pricing_rules` (`/api/pricing/current`). Disponibilidad: `reservations` + `blocked_slots` (`/api/booked-slots`).

## Decisions

### 1. Una sola base de conocimiento

FAQ y guía de la sala son la misma colección: muchas normas ya están en la FAQ y no deben escribirse dos veces. Cada documento dice en qué páginas sale con `pages`:

- `como-funciona`: se muestra en la FAQ pública (dudas antes de reservar).
- `guia-sala`: se muestra en la guía (uso de la sala el día del evento).
- Un documento puede estar en las dos (p. ej. normas del espacio).

### 2. Estructura: hubs → detalle, y Operaciones

```
content/kb/
  panel-de-control.md        # hub · punto de partida de la guía
  reserva.md                 # hub · FAQ "La reserva"
  dia-del-evento.md          # hub · FAQ "El día de tu evento"
  decoracion-y-limpieza.md   # hub
  normas.md                  # hub · normas del espacio
  zonas/
    chiquipark.md            # detalle
  operaciones/
    encender-sala.md         # operación
    desactivar-sala.md       # operación
```

Tres tipos (`type` en el frontmatter):

| `type` | Para qué | Cuerpo |
|---|---|---|
| `hub` | Página principal de un tema; respuestas cortas y enlaces al detalle | un `## Pregunta` por pregunta |
| `detalle` | Explicación completa de un elemento (una zona, un equipo) | un `## Pregunta` por pregunta |
| `operacion` | Una acción concreta que el cliente hace en la sala | plantilla fija (abajo) |

Frontmatter común:

```md
---
type: hub                    # hub | detalle | operacion
title: Normas del espacio
pages: [como-funciona, guia-sala]
parent: null                 # slug del hub del que cuelga (detalle/operación)
order: 4
emoji: 📋
tags: [normas, aforo, niños]
---
```

- Enlaces entre documentos con ruta relativa al `.md` (`[Chiquipark](zonas/chiquipark.md)`); en build se convierten en `/guia-sala/zonas/chiquipark`. **Un enlace roto hace fallar el build.**
- `/guia-sala` lista los hubs con `guia-sala`; la sección **Operaciones** lista todas las `operacion` (título + "cuándo"), agrupadas por `tags`.
- Cada documento tiene su página `/guia-sala/<slug>` (`getStaticPaths`), útil para enlazar desde el chatbot y compartir por WhatsApp.

Plantilla de operación (secciones obligatorias; si falta alguna, el build falla):

```md
---
type: operacion
title: Encender sala
parent: panel-de-control
when: Nada más entrar en la sala
tags: [panel, inicio]
---

## Para qué sirve
## Cuándo usarla
## Pasos
## Qué hace
## Si algo falla
```

`src/lib/kb.ts` expone `getKbDocs({ page?, type? })` y `getKbDoc(slug)` → `{ slug, type, title, pages, parent, order, emoji, tags, when?, items: { question, answer }[] | sections: Record<string, string>, raw }`. Parseo con `gray-matter` y split por `^## `. Solo en servidor (build y `/api/chat`).

### 3. Páginas estáticas

- `/como-funciona`: hubs y detalles con `pages` ∋ `como-funciona`, como acordeón por hub (igual que hoy).
- `/guia-sala`: empieza por el **Panel de control**, luego el resto de hubs y la sección Operaciones.
- Cambiar un `.md` requiere commit + deploy (Vercel lo hace al hacer push a `main`). Sin ISR: el contenido cambia poco.
- `/guia-sala/panel`: vista para la pantalla de la sala con el widget del chat abierto. **Pregunta abierta**: ¿pública o con token/sesión de la reserva del día?

### 3b. Contenido recogido hasta ahora

Se redacta en los `.md` al implementar (tarea 1.x); aquí queda lo que ha dictado el propietario:

- **Panel de control** (punto de partida): todo empieza en el panel. Agrupa las funcionalidades principales por tipología y tiene botones que agrupan varias acciones.
- **Encender sala**: usarlo al principio, nada más entrar; inicializa el audio y las luces.
- **Desactivar sala**: a la inversa; al terminar, apaga todo lo que ya no va a hacer falta.
- **Chiquipark**: solo pueden usarlo menores de 14 años.
- Normas ya existentes en la FAQ (aforo 50, no fumar, mascotas, volumen, sin equipo de sonido propio, materiales prohibidos, limpieza) pasan a `normas.md` / `decoracion-y-limpieza.md` sin duplicarse.

### 4. Chatbot: contexto completo, no RAG

- El volumen es pequeño (≈30 preguntas, unos pocos miles de tokens). Meter todos los `.md` en el prompt de sistema es más simple y más preciso que embeddings + búsqueda.
- El bloque del prompt de sistema con la KB se marca con `cache_control` (prompt caching): es idéntico en cada llamada y abarata el coste por mensaje.
- Cada documento entra con su slug y URL, para que el bot enlace el detalle ("Más info: /guia-sala/zonas/chiquipark").
- Para operaciones, el bot responde con los **Pasos** de la plantilla y enlaza la operación.
- Revisar RAG solo si la KB supera ~50k tokens.

### 5. Precio y disponibilidad por herramientas

Los `.md` **no** son fuente de verdad para precio ni fechas libres (se quedarían viejos). El modelo tiene dos herramientas:

| Herramienta | Entrada | Fuente |
|---|---|---|
| `get_pricing` | – | `pricing_rules` activas (misma consulta que `/api/pricing/current`) + constantes de `src/utils/pricing.ts` (hora extra, etc.) |
| `check_availability` | `date` (YYYY-MM-DD), `time_slot?` | `reservations` + `blocked_slots` (misma lógica que `/api/booked-slots`), más `BOOKINGS_FROM_DATE` |

- Las consultas se extraen a `src/lib/pricingRules.ts` y `src/lib/bookedSlots.ts`; las APIs actuales pasan a usarlas. El chatbot llama a las funciones directamente, no por HTTP a su propia API.
- Prompt de sistema: "para precios y disponibilidad usa SIEMPRE las herramientas; si una cifra de la KB contradice a la herramienta, manda la herramienta".
- Algunas respuestas de la FAQ actual incluyen cifras (60 €/hora extra, fianza 150 €). Se mantienen para la web, pero es deuda: al migrar, revisar si se pueden enlazar a `/precios` en vez de repetir la cifra.

### 6. Endpoint `POST /api/chat`

- Body: `{ messages: { role: 'user' | 'assistant', content: string }[] }`. Historial en el cliente (sin persistir en BD en esta fase).
- Bucle de tool use en servidor (máx. 3 iteraciones) y devuelve `{ reply }`. Streaming queda fuera de esta fase.
- Modelo: Haiku (rápido y barato, suficiente para FAQ); id centralizado en `src/lib/ai.ts`.
- Límites: máx. 20 mensajes y 1 000 caracteres por mensaje; rate limit por IP (p. ej. 20 mensajes / 10 min); `max_tokens` ≈ 600.
- Idioma: responde en el idioma del cliente (por defecto castellano), tono de la web.

### 7. Derivación a WhatsApp

- Si la respuesta no está en la KB ni en las herramientas, o el cliente pide hablar con una persona, el bot lo dice y ofrece `CONTACT_INFO.whatsapp` con un mensaje prerrellenado. Nunca inventa.
- La respuesta incluye `handoff: true` para que el widget muestre un botón de WhatsApp.
- El bot no crea ni modifica reservas: para reservar, enlaza a `/disponibilidad`.

### 8. Widget

- `ChatWidget` flotante (abajo a la derecha), cargado con `next/dynamic` para no penalizar la carga inicial. Montado en `_app.tsx` para páginas públicas (excluye `/admin`) y abierto por defecto en `/guia-sala/panel`.
- En móvil no debe tapar la barra inferior de `/mis-eventos/[id]` (no se monta ahí).
- Eventos GA4: `chat_open`, `chat_message`, `chat_handoff_whatsapp`.

## Risks / Trade-offs

- **Coste/abuso** del endpoint público → rate limit, límites de longitud, prompt caching.
- **Alucinaciones** → instrucciones estrictas + derivación a WhatsApp + herramientas para cifras.
- **Prompt injection** desde el usuario → el bot no tiene herramientas de escritura; solo lectura de precios y huecos libres (sin datos personales de otras reservas).
- **Privacidad**: no se guardan conversaciones en esta fase; avisar en el widget de que es un asistente automático.

## Open Questions

- Resto del contenido de la guía: el propietario lo irá dictando (ver 3b). Pendiente: qué grupos de funcionalidades muestra el panel, pasos exactos de cada botón, wifi, electrodomésticos, salida, emergencias.
- Acceso a `/guia-sala/panel`: pública o protegida.
- ¿Guardar conversaciones (anonimizadas) para mejorar la KB? Implica actualizar la política de privacidad.

## Later phase: WhatsApp

Reutilizar el mismo núcleo (`src/lib/kbChat.ts`: prompt + herramientas + bucle) desde el webhook de WhatsApp Cloud API. Requiere persistir el historial por número.
