# Tasks: mis-eventos

## T1 — Añadir ítem "Mis Eventos" al Header

**Archivo**: `src/components/Header.tsx`

- Añadir `{ href: '/mis-eventos', label: 'Mis Eventos' }` al array `navItems` antes del ítem condicional de Área privada / Panel admin
- Sin condición de sesión — visible siempre
- Verificar que aparece en desktop y en el menú móvil

## T2 — Crear página `/mis-eventos`

**Archivo**: `src/pages/mis-eventos.tsx`

- Implementar `getServerSideProps` con redirect a `/area-privada` si hay sesión
- Sección 1: Hero con imagen `Happyhub_eventos.png`, overlay, badge, H1, subtítulo y CTAs
- Sección 2: Timeline de 3 fases (Antes / Durante / Después) con sus items
- Sección 3: Grid 4x2 de funcionalidades con iconos Lucide
- Sección 4: 3 cards de servicios adicionales
- Sección 5: CTA final con gradiente
- `<Head>` con title y meta description SEO

## T3 — Verificar en producción

- `git add`, commit, push a main
- Verificar que `/mis-eventos` carga correctamente
- Verificar redirect para usuario logueado
- Verificar que el ítem aparece en el menú (desktop y móvil)
- Verificar que la imagen hero se muestra correctamente
