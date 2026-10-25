## Why

Las operaciones del negocio (cómo funciona Home Assistant por dentro, cómo actualizar la guía, qué revisar tras un evento…) solo las conoce el propietario. Los familiares que ayudan necesitan un manual interno, que **no** puede verse en la web pública ni llegar al chatbot de clientes.

## What Changes

- Nuevo manual interno en `content/interno/*.md`, con el mismo formato que la base de conocimiento pública (`hub`, `detalle`, `operacion` con plantilla común).
- Nuevas páginas `/admin/manual` y `/admin/manual/<slug>` dentro del panel de administración, con entrada "Manual interno" en el menú lateral.
- Solo usuarios con rol `admin`: la sesión se comprueba **en el servidor** (`getServerSideProps`) antes de leer el contenido; sin sesión de admin, redirige a `/login` y no se envía nada del manual.
- Contenido inicial: Home Assistant de la sala (scripts y entidades) y cómo actualizar la guía de la sala.

## Capabilities

### New Capabilities

- `internal-manual`: manual interno de operaciones visible solo para administradores

## Impact

- **Contenido**: nuevo `content/interno/`
- **Backend**: `src/lib/kb.ts` acepta otra carpeta (`content/interno`) y otra ruta base
- **Frontend**: nuevas `src/pages/admin/manual/index.tsx` y `[...slug].tsx`; `DashboardNav`; el cuerpo de documento de la guía se extrae a un componente común
- **Despliegue**: `next.config.js` incluye `content/interno/**` en las funciones de esas páginas (`outputFileTracingIncludes`), porque se leen en tiempo de petición
