## Why

La guía de usuario (`content/kb/`) y el manual interno (`content/interno/`) ya viven en carpetas separadas, pero nada **garantiza** que un texto interno (entidades de Home Assistant, rutas de admin, scripts) no acabe en la guía pública o en el chatbot. Además el manual interno es un único documento largo de Home Assistant, difícil de localizar y de resumir, y la guía pública no tiene una operación para el nuevo botón **Música ON**.

## What Changes

- **Separación garantizada en el build**: si un documento público contiene marcas internas (`switch.`, `script.`, `sensor.`, `media_player.`, `input_text.`, `climate.`, `/admin/`, `content/interno`, `homeassistant.local`), el build falla. Los documentos internos no pueden declarar `pages` (no se publican en ninguna página pública).
- **Campo `summary`** opcional (una línea) en el frontmatter: se muestra en los listados y encabeza el texto que recibe el chatbot. Obligatorio en los `hub`.
- **Manual interno reorganizado** en dos temas (hubs) con subpáginas anidadas por `parent`:
  - `sala/home-assistant` → detalles `panel-de-la-tablet`, `scripts`, `entidades`; operaciones `instalar-cambios-home-assistant`, `cliente-no-oye-musica`, `cambiar-nombre-evento`, `reactivar-gramola`.
  - `guias/guias-y-manual` → la regla de separación y sincronización; operaciones `actualizar-guia`, `dar-acceso-al-manual`.
- La portada del manual muestra los temas (hubs) y todas las operaciones; cada tema enlaza sus subpáginas.
- **Guía pública**: nueva operación «Encender la música (Música ON)»; títulos de operaciones alineados con los botones (Sala ON / Sala OFF); `summary` en los hubs.
- `CLAUDE.md`: la regla de sincronizar guías aplica a Home Assistant y a todo cambio de comportamiento o usabilidad de la web, y describe la estructura.

## Capabilities

### Modified Capabilities

- `knowledge-base`: separación pública/interna verificada, `summary`, estructura por temas

## Impact

- `src/lib/kb.ts`, nuevo `src/lib/kbManual.ts`, `src/lib/kbTypes.ts`, `src/pages/admin/manual/index.tsx`, `src/components/guide/*` (mostrar `summary`)
- `src/__tests__/kb.test.ts`
- `content/kb/**`, `content/interno/**`, `content/kb/README.md`, `content/interno/README.md`, `CLAUDE.md`
