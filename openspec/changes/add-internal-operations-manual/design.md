## Context

- `AdminLayout` solo redirige en el navegador si el usuario no es admin. Sirve para pantallas cuyos datos vienen de APIs protegidas, pero **no** para contenido incrustado en la página: con `getStaticProps` el texto acabaría en el HTML y en `/_next/data/*.json`, accesibles sin sesión.
- `src/lib/kb.ts` ya parsea y valida Markdown con frontmatter (`hub` / `detalle` / `operacion`).

## Decisions

### 1. Carpeta separada, nunca mezclada con la KB pública

- Manual interno en `content/interno/`; la KB pública sigue en `content/kb/`.
- `loadKb()` sin argumentos solo lee `content/kb/`: las páginas públicas y el futuro chatbot **no pueden** cargar el manual por error. Un test lo comprueba.
- Enlaces entre documentos internos → `/admin/manual/<slug>`. Para enlazar a la guía pública se usa la URL absoluta (`/guia-sala/...`).

### 2. Control de acceso en el servidor

- `getServerSideProps` en `/admin/manual` y `/admin/manual/[...slug]`: `getServerSession(req, res, authOptions)`; si no hay sesión o `role !== 'admin'` → `redirect: /login`. Solo después se lee el contenido.
- Las respuestas con sesión son privadas (Next.js envía `Cache-Control: private, no-cache, no-store` en `getServerSideProps`).
- Se mantiene además `AdminLayout` para la navegación.
- Los familiares tienen cuenta con rol `admin` (decisión del propietario, 2026-10-25): acceso completo al panel, no solo al manual. No se crea un rol de solo lectura.

### 3. Lectura en tiempo de petición

- Al usar `getServerSideProps`, el contenido se lee del disco en cada petición. En Vercel las funciones solo llevan los ficheros que Next.js detecta; se añade `experimental.outputFileTracingIncludes` con `./content/interno/**/*` para estas rutas.
- Cambiar el manual = editar el `.md` y hacer push a `main`, igual que la guía.

### 4. Reutilización

- Mismo parser, validación (enlaces rotos, plantilla de operación) y render que la KB pública.
- El cuerpo del documento (`GuideDoc`) se extrae a `KbDocBody`, usado por la guía y por el manual.
