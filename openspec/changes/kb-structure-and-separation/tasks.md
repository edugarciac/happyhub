## 1. Código

- [x] 1.1 `kb.ts`: `summary` (obligatorio en hub), marcas internas en la KB pública, internos sin `pages`
- [x] 1.2 Portada del manual: temas sin padre + operaciones; `summary` en listados
- [x] 1.3 Tests
- [x] 1.4 `kbManual.ts`: el manual fuera del módulo público (0 ficheros internos en los bundles públicos y del chatbot)

## 2. Contenido

- [x] 2.1 Manual interno reorganizado (sala/, guias/, operaciones/)
- [x] 2.2 Guía pública: operación Música ON, títulos Sala ON / Sala OFF, `summary` en hubs
- [x] 2.3 README de `content/kb` y `content/interno`; `CLAUDE.md`

## 3. Verify

- [x] 3.1 `npx tsc --noEmit`, `npm test`, `npm run build`
