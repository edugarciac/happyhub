## Context

- La FAQ vive hoy como un array `categories` dentro de `src/pages/como-funciona.tsx` (4 categorías). **No existen** `src/data/faqs.ts`, `src/data/guiaSala.ts`, `/guia-sala` ni `/guia-sala/panel`: este cambio los crea a partir de `content/kb/`.
- `src/lib/ai.ts` ya instancia el cliente de Anthropic (`generateText`, sin herramientas).
- Precios: tabla `pricing_rules` (`/api/pricing/current`). Disponibilidad: `reservations` + `blocked_slots` (`/api/booked-slots`).

## Decisions

### 1. Formato de los `.md`

Un fichero por categoría, el `## ` de segundo nivel es la pregunta y el cuerpo es la respuesta:

```md
---
title: La reserva
category: faq          # faq | guia-sala
emoji: 📅
order: 1
tags: [reserva, pago, cancelación]
---

## ¿Cómo puedo reservar el espacio?

Selecciona la fecha y franja horaria…

## ¿Cuál es la política de cancelación?

Si cancelas con 15 días o más…
```

- `src/lib/kb.ts` expone `getKbDocs(category?)` → `{ slug, title, category, emoji, order, tags, items: { question, answer }[] , raw }[]`. Parseo con `gray-matter` y split por `^## `.
- Solo se ejecuta en servidor (build y `/api/chat`), nunca en el bundle de cliente.
- Las respuestas admiten Markdown (enlaces, listas); se renderizan a HTML en build.

### 2. Páginas estáticas

- `/como-funciona` y `/guia-sala`: `getStaticProps` → `getKbDocs('faq' | 'guia-sala')`. Cambiar un `.md` requiere commit + deploy (Vercel lo hace al hacer push a `main`), igual que hoy. Sin ISR: el contenido cambia poco.
- `/guia-sala/panel`: vista de la guía pensada para la tablet/pantalla de la sala, con el widget del chat abierto. **Pregunta abierta**: ¿es pública o va con token/sesión de la reserva del día?

### 3. Chatbot: contexto completo, no RAG

- El volumen es pequeño (≈30 preguntas, unos pocos miles de tokens). Meter todos los `.md` en el prompt de sistema es más simple y más preciso que embeddings + búsqueda.
- El bloque del prompt de sistema con la KB se marca con `cache_control` (prompt caching): es idéntico en cada llamada y abarata el coste por mensaje.
- Revisar RAG solo si la KB supera ~50k tokens.

### 4. Precio y disponibilidad por herramientas

Los `.md` **no** son fuente de verdad para precio ni fechas libres (se quedarían viejos). El modelo tiene dos herramientas:

| Herramienta | Entrada | Fuente |
|---|---|---|
| `get_pricing` | – | `pricing_rules` activas (misma consulta que `/api/pricing/current`) + constantes de `src/utils/pricing.ts` (hora extra, etc.) |
| `check_availability` | `date` (YYYY-MM-DD), `time_slot?` | `reservations` + `blocked_slots` (misma lógica que `/api/booked-slots`), más `BOOKINGS_FROM_DATE` |

- Las consultas se extraen a `src/lib/pricingRules.ts` y `src/lib/bookedSlots.ts`; las APIs actuales pasan a usarlas. El chatbot llama a las funciones directamente, no por HTTP a su propia API.
- Prompt de sistema: "para precios y disponibilidad usa SIEMPRE las herramientas; si una cifra de la KB contradice a la herramienta, manda la herramienta".
- Algunas respuestas de la FAQ actual incluyen cifras (60 €/hora extra, fianza 150 €). Se mantienen para la web, pero es deuda: al migrar, revisar si se pueden enlazar a `/precios` en vez de repetir la cifra.

### 5. Endpoint `POST /api/chat`

- Body: `{ messages: { role: 'user' | 'assistant', content: string }[] }`. Historial en el cliente (sin persistir en BD en esta fase).
- Bucle de tool use en servidor (máx. 3 iteraciones) y devuelve `{ reply }`. Streaming queda fuera de esta fase.
- Modelo: Haiku (rápido y barato, suficiente para FAQ); id centralizado en `src/lib/ai.ts`.
- Límites: máx. 20 mensajes y 1 000 caracteres por mensaje; rate limit por IP (p. ej. 20 mensajes / 10 min); `max_tokens` ≈ 600.
- Idioma: responde en el idioma del cliente (por defecto castellano), tono de la web.

### 6. Derivación a WhatsApp

- Si la respuesta no está en la KB ni en las herramientas, o el cliente pide hablar con una persona, el bot lo dice y ofrece `CONTACT_INFO.whatsapp` con un mensaje prerrellenado. Nunca inventa.
- La respuesta incluye `handoff: true` para que el widget muestre un botón de WhatsApp.
- El bot no crea ni modifica reservas: para reservar, enlaza a `/disponibilidad`.

### 7. Widget

- `ChatWidget` flotante (abajo a la derecha), cargado con `next/dynamic` para no penalizar la carga inicial. Montado en `_app.tsx` para páginas públicas (excluye `/admin`) y abierto por defecto en `/guia-sala/panel`.
- En móvil no debe tapar la barra inferior de `/mis-eventos/[id]` (no se monta ahí).
- Eventos GA4: `chat_open`, `chat_message`, `chat_handoff_whatsapp`.

## Risks / Trade-offs

- **Coste/abuso** del endpoint público → rate limit, límites de longitud, prompt caching.
- **Alucinaciones** → instrucciones estrictas + derivación a WhatsApp + herramientas para cifras.
- **Prompt injection** desde el usuario → el bot no tiene herramientas de escritura; solo lectura de precios y huecos libres (sin datos personales de otras reservas).
- **Privacidad**: no se guardan conversaciones en esta fase; avisar en el widget de que es un asistente automático.

## Open Questions

- Contenido de la guía de la sala: no existe aún; hay que redactarlo (normas, wifi, electrodomésticos, limpieza, salida, emergencias).
- Acceso a `/guia-sala/panel`: pública o protegida.
- ¿Guardar conversaciones (anonimizadas) para mejorar la KB? Implica actualizar la política de privacidad.

## Later phase: WhatsApp

Reutilizar el mismo núcleo (`src/lib/kbChat.ts`: prompt + herramientas + bucle) desde el webhook de WhatsApp Cloud API. Requiere persistir el historial por número.
