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
    sala-kids.md             # detalle · Chiquipark, luz y aire de la Sala Kids
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

- Enlaces entre documentos con ruta relativa al `.md` (`[Chiquipark](zonas/sala-kids.md)`); en build se convierten en `/guia-sala/zonas/sala-kids`. **Un enlace roto hace fallar el build.**
- `/guia-sala` lista los hubs con `guia-sala`; la sección **Operaciones** lista todas las `operacion` (título + "cuándo"), ordenadas por `order`; las `detalle` salen en **Zonas**.
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
- `/guia-sala/panel`: la abre el botón **Ayuda** del panel de Home Assistant dentro de un `iframe` (vista `ayuda` del dashboard `panel-clientes`, tablet en modo kiosco). Por eso:
  - Sin cabecera, pie ni menú de la web; botones grandes para pantalla táctil; enlaces internos se quedan dentro de `/guia-sala/panel/...`.
  - Empieza por el Panel de control y Operaciones; el widget del chat va abierto.
  - Es pública (no hay sesión en la tablet) y solo muestra contenido de la KB.
  - **Cabeceras**: `next.config.js` envía `X-Frame-Options: SAMEORIGIN` a todas las rutas, que bloquearía el iframe. Para `/guia-sala/panel/:path*` se quita `X-Frame-Options` y se añade `frame-ancestors 'self' http://homeassistant.local https://homeassistant.local` a la CSP (la tablet abre Home Assistant en la red local como `homeassistant.local`, sin puerto: 80/443). El resto de rutas no cambian.
  - `noindex` para que no aparezca en buscadores.

### 3b. Contenido recogido hasta ahora

Redactado en `content/kb/` (tarea 1.3). Fuente: lo dictado por el propietario y el dashboard de Home Assistant `panel-clientes` (tablet de la sala en modo kiosco).

**Panel de control (punto de partida)**. Arriba: logo, nombre del evento (o "Celebra momentos inolvidables" si no hay) y tres botones:

| Botón | Texto en el panel | Qué hace | Notas |
|---|---|---|---|
| Activar | Luces y música | `script.encender_sala` (ver abajo) | Usarlo nada más entrar |
| Desactivar | Apaga todo | `script.cerrar_sala` (ver abajo) | Pide confirmación: "¿Desactivar toda la sala?". Usarlo al salir |
| Ayuda | Cómo funciona la sala | Abre esta guía (`/guia-sala/panel`) | |

**Activar** (`script.encender_sala`, modo `single`) enciende, en este orden:
1. Luces Sala Principal, Barra y Jardín, y amplificador de audio.
2. Luz Sala Kids (si falla, el resto sigue).
3. A los 3 segundos, el subwoofer.

**No** enciende: el aire acondicionado ni la música (deja el equipo listo; la música se elige en Gramola o con "Conectar mi móvil"). Amplificador y subwoofer no tienen botón en el panel: **sin pulsar Activar no suena nada**. Para la ficha "Si algo falla": no suena la música → pulsar Activar y esperar unos segundos; no se enciende la Sala Kids → encenderla desde Luces.

**Desactivar** (`script.cerrar_sala`, alias "Cerrar sala", modo `single`), en este orden:
1. Pausa la música.
2. Apaga el subwoofer y, a los 3 segundos, el amplificador y las luces Sala Principal, Barra y Jardín.
3. Apaga la luz Sala Kids y los dos aires acondicionados (si alguno falla, el resto sigue).

La Barra se añade a `encender_sala` y `cerrar_sala` (decisión del propietario). Para la ficha: es lo último que se hace antes de salir, porque deja la sala a oscuras.

Debajo, tres grupos por tipología:

- **Luces** (interruptores, tocar para encender/apagar): Sala Principal, Sala Kids, Barra, Jardín.
- **Aire acondicionado**: Sala Principal y Sala Kids, cada uno con temperatura y modos frío, calor, ventilador y apagado.
- **Música**:
  - **Gramola** → listas: Música Española, Cumpleaños, Verbena, Remember.
  - **Conectar mi móvil** (`script.modo_bluetooth`, alias "Conectar móvil"): pide confirmación ("Si hay otro móvil sonando se desconectará"), cambia el amplificador a *Line In* para soltar el móvil anterior, espera **8 segundos** y vuelve a *Bluetooth* en modo emparejamiento. Para el cliente:
    1. Pulsar "Conectar mi móvil" y confirmar.
    2. Esperar unos 10 segundos, hasta que el estado diga "Listo para conectar".
    3. En el Bluetooth del móvil, elegir «HappyHub Música».
    4. Poner música: el estado cambia a "Móvil conectado".
    - Si falla: volver a pulsar cuando hayan pasado los 8 s (si se pulsa mientras está en marcha, no hace nada: modo `single`); comprobar que el móvil no sigue conectado a otro altavoz.
  - Estado: "Listo para conectar" / "Móvil conectado" / fuente actual.
  - "Sonando ahora": anterior, play/pausa, siguiente, volumen y silencio.

**Otras normas**

- **Sala Kids**: es donde está el **Chiquipark**, que solo pueden usar menores de 14 años. En el panel tiene su propia luz ("Sala Kids") y su propio aire acondicionado. `normas.md` enlaza a `zonas/sala-kids.md`.
- Normas ya existentes en la FAQ (aforo 50, no fumar, mascotas, volumen, materiales prohibidos, limpieza) pasan a `normas.md` / `decoracion-y-limpieza.md` sin duplicarse.
- **Corregir al fusionar**: la FAQ dice "No se puede conectar tu propio equipo de música". Hay que matizar que sí se puede poner música desde el móvil por Bluetooth (operación "Conectar mi móvil"); lo que no se permite es traer equipos de sonido.

**Operaciones previstas** (plantilla común): `encender-sala`, `desactivar-sala`, `conectar-movil-bluetooth`, `poner-gramola`, `ajustar-aire`, `encender-luces`.

**Pendiente de confirmar**: confirmar que `encender_sala` y `cerrar_sala` ya incluyen la luz de la Barra antes de publicar la ficha.

### 4. Chatbot: contexto completo, no RAG

- El volumen es pequeño (≈30 preguntas, unos pocos miles de tokens). Meter todos los `.md` en el prompt de sistema es más simple y más preciso que embeddings + búsqueda.
- El bloque del prompt de sistema con la KB se marca con `cache_control` (prompt caching): es idéntico en cada llamada y abarata el coste por mensaje.
- Cada documento entra con su slug y URL, para que el bot enlace el detalle ("Más info: /guia-sala/zonas/sala-kids").
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
- Bucle de tool use en servidor (máx. 4 rondas) y devuelve `{ reply, handoff }`. Sin streaming en esta fase.
- Modelo: **Claude Haiku 5.5** (`claude-haiku-5-5`, decisión del propietario por coste: ≈0,05 céntimos por mensaje), `effort: low`, `max_tokens` 4096 (incluye el razonamiento). Constante `CHAT_MODEL` en `src/lib/kbChat.ts`; el cliente de Anthropic se comparte desde `src/lib/ai.ts`.
- Prompt: reglas + toda la KB pública en un bloque de sistema con `cache_control`; la fecha de hoy va en un segundo bloque después del corte para no invalidar la caché.
- Límites: máx. 20 mensajes y 1 000 caracteres por mensaje del cliente; 20 mensajes cada 10 min por IP y tope diario global (`CHAT_DAILY_LIMIT`, 1 000 por defecto) para acotar el coste. Se cuentan en la tabla `chat_usage` (solo hash de la IP, se borra a los 2 días), porque en Vercel la memoria no se comparte entre instancias.
- Si la API de Claude falla, el modelo rechaza la petición o el bucle no termina, se responde con la derivación a WhatsApp.
- Idioma: responde en el idioma del cliente (por defecto castellano), tono de la web.

### 7. Derivación a WhatsApp

- Si la respuesta no está en la KB ni en las herramientas, o el cliente pide hablar con una persona, el bot lo dice y ofrece `CONTACT_INFO.whatsapp` con un mensaje prerrellenado. Nunca inventa.
- El modelo llama a la herramienta `derivar_a_whatsapp`; la respuesta incluye entonces `handoff: true` y el widget muestra el botón de WhatsApp.
- El bot no crea ni modifica reservas: para reservar, enlaza a `/disponibilidad`.

### 8. Widget

- `ChatWidget` flotante (abajo a la derecha), cargado con `next/dynamic` para no penalizar la carga inicial. Montado en `_app.tsx` para páginas públicas (excluye `/admin`) y abierto por defecto en `/guia-sala/panel`.
- En móvil no debe tapar la barra inferior de `/mis-eventos/[id]` (no se monta ahí).
- Eventos GA4: `chat_open`, `chat_message`, `chat_handoff_whatsapp`. `event()` de `src/lib/analytics.ts` no hace nada si `gtag` no está cargado (cookies rechazadas, tablet): antes lanzaba un error.
- La conversación se guarda en `sessionStorage` y se olvida tras 30 min sin uso, para que en la tablet no la vea el siguiente cliente.
- Las respuestas admiten un Markdown mínimo (enlaces internos o https, negrita, listas); todo lo demás se escapa. En la tablet, los enlaces a `/guia-sala/...` se quedan dentro de `/guia-sala/panel/...`.

## Risks / Trade-offs

- **Coste/abuso** del endpoint público → rate limit, límites de longitud, prompt caching.
- **Alucinaciones** → instrucciones estrictas + derivación a WhatsApp + herramientas para cifras.
- **Prompt injection** desde el usuario → el bot no tiene herramientas de escritura; solo lectura de precios y huecos libres (sin datos personales de otras reservas).
- **Privacidad**: no se guardan conversaciones en esta fase; avisar en el widget de que es un asistente automático.

## Open Questions

- Resto del contenido de la guía: el propietario lo irá dictando (ver 3b). Pendiente: lo marcado en 3b, wifi, electrodomésticos, salida, emergencias.
- Si algún día la tablet abre Home Assistant por otra URL (Nabu Casa, IP), hay que añadirla a `frame-ancestors` o el botón Ayuda dejará de mostrar la guía.
- ¿Guardar conversaciones (anonimizadas) para mejorar la KB? Implica actualizar la política de privacidad.

## Later phase: WhatsApp

Reutilizar el mismo núcleo (`src/lib/kbChat.ts`: prompt + herramientas + bucle) desde el webhook de WhatsApp Cloud API. Requiere persistir el historial por número.
