# Base de conocimiento de HappyHub

Guía **pública** para clientes: fuente única de la FAQ (`/como-funciona`), de la guía de la sala (`/guia-sala`, y `/guia-sala/panel` en la tablet) y del chatbot.

**Aquí nunca va nada interno.** Cómo funciona algo por dentro (Home Assistant, scripts, admin, procesos del negocio) va en `content/interno/`. Si un texto contiene una marca interna (`switch.`, `script.`, `sensor.`, `media_player.`, `input_text.`, `climate.`, `/admin/`, `content/interno`, `homeassistant.local`… ver `INTERNAL_MARKERS` en `src/lib/kb.ts`), el build falla.

## Reglas

- Cada pregunta se escribe **una sola vez**. `pages` decide dónde se muestra: `como-funciona`, `guia-sala` o las dos.
- `type`:
  - `hub`: página principal de un tema. Obligatorio `summary` (una línea). Un `## ` por pregunta, respuestas cortas y enlaces al detalle.
  - `detalle`: explicación completa de una zona o un equipo. Un `## ` por pregunta.
  - `operacion`: una acción concreta en la sala. Secciones obligatorias: `## Para qué sirve`, `## Cuándo usarla`, `## Pasos`, `## Qué hace`, `## Si algo falla`, y `when` en el frontmatter.
- `summary` (opcional salvo en `hub`): una línea que resume el documento. Sale en los listados y encabeza el documento en el chatbot. Si contiene `:`, va entre comillas.
- Organización: `<tema>.md` = hub; `zonas/`, `<tema>/` = explicaciones con `parent` al hub; `operaciones/` = operaciones con `parent` al hub.
- Enlaces entre documentos: ruta relativa al `.md`, p. ej. `[Sala Kids](zonas/sala-kids.md)`. Si el destino no existe, el build falla.
- Variables `{{nombre}}` (se sustituyen al publicar, definidas en `TOKENS` de `src/lib/kb.ts`):
  - `{{whatsapp}}`: enlace de WhatsApp de `src/config/contact.ts`.
  - `{{metodos_senal}}` y `{{nota_bizum}}`: formas de pago de la señal según `BIZUM_ENABLED` de `src/config/payments.ts`.
- **Precios**: no escribir el precio del alquiler por día y franja (sale de la BD); enlazar a `/precios`.

Este fichero (`README.md`) no se publica.
