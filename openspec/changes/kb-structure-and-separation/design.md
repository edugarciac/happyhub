## Decisions

- **La garantía vive en `loadKb()`**, no solo en tests: al cargar `content/kb` se buscan marcas internas en todo el texto y el build falla con el fichero y la marca. Así ni una edición desde GitHub puede publicar algo interno.
- **Módulo aparte para el manual** (`kbManual.ts`): si `kb.ts` mencionara `content/interno`, Next empaquetaría esos `.md` con las páginas públicas y el chatbot (verificado en los `.nft.json` del build). Con el módulo aparte, solo las páginas de `/admin/manual` los incluyen. Un test impide volver a referenciarlo desde `kb.ts`.
- **Lista de marcas** (`INTERNAL_MARKERS`): prefijos de entidades de Home Assistant, `/admin/`, `content/interno`, `homeassistant.local`. Si en el futuro la guía pública necesita una de ellas, se cambia la lista a propósito (decisión visible en el diff).
- **Internos sin `pages`**: `pages` es lo que publica un documento en `/como-funciona` o `/guia-sala`; en el manual no tiene sentido y se rechaza.
- **Anidamiento con `parent`** (ya existente): una página muestra sus hijos en «Relacionado». La portada del manual lista solo los temas sin padre + todas las operaciones (acceso rápido por "cuándo").
- **`summary`**: una línea que resume el documento. En listados se muestra `when` (operaciones) o `summary`. En el prompt del chatbot va como `Resumen:` bajo el título, para localizar rápido el documento correcto. Obligatorio en `hub` para que cada tema tenga su resumen.
- **Estructura de carpetas** (convención, documentada en los README):
  - `<tema>.md` o `<tema>/<tema>.md` = hub; `<tema>/<detalle>.md` = explicación; `operaciones/<accion>.md` = operación con `parent` al hub del tema.
