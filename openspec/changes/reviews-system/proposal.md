## Why

El sistema de reseñas existe parcialmente (tabla DB, APIs, componentes) pero no está conectado ni funcional:
- La página `/admin/reviews` da error (posible falta de tabla en DB o bug en la consulta)
- La página `/admin/clients` no existe (404)
- No hay sección de reseñas en la página home
- Los usuarios no pueden enviar reseñas desde el Área Privada
- El modelo actual usa `is_published` (boolean), pero se necesitan 4 estados: En revisión, Publicada, Archivada, Cancelada

## What Changes

- **BREAKING**: Migrar `is_published BOOLEAN` a `status VARCHAR` con valores: `pending_review`, `published`, `archived`, `cancelled`
- Arreglar página `/admin/reviews` con gestión de estados (transiciones entre los 4 estados)
- Crear página `/admin/clients` con listado de usuarios registrados
- Añadir sección de reseñas publicadas en la home (`index.tsx`) debajo de la sección de Instagram
- Añadir formulario "Publicar reseña" en Área Privada con: título, descripción, rating 1-5 estrellas, opción de fotos
- Añadir campo `title` a la tabla `reviews`
- Añadir soporte para fotos en reseñas

## Capabilities

### New Capabilities

- `review-status-management`: Gestión de estados de reseñas desde admin (En revisión → Publicada/Archivada/Cancelada)
- `review-submission`: Formulario de envío de reseñas desde Área Privada con título, descripción, rating y fotos
- `public-reviews-display`: Sección de reseñas publicadas en la página home
- `admin-clients-page`: Página de gestión de clientes registrados

### Modified Capabilities

_(ninguna — no hay specs previos)_

## Impact

- `database/migrations/006_reviews_status_and_fields.sql` — migrar is_published → status, añadir title, photo_urls
- `src/pages/admin/reviews.tsx` — reescribir con gestión de estados
- `src/pages/admin/clients.tsx` — nueva página
- `src/pages/index.tsx` — añadir sección de reseñas
- `src/pages/area-privada.tsx` — añadir botón y formulario de reseña
- `src/pages/api/reviews/index.ts` — adaptar a status en vez de is_published
- `src/pages/api/reviews/[id]/publish.ts` — adaptar a transiciones de estado
- `src/pages/api/admin/reviews.ts` — adaptar filtros a status
- `src/components/ReviewForm.tsx` — añadir campos title y fotos
- `src/components/ReviewList.tsx` — filtrar por status='published'
- Reutilizar: StarRating, ReviewCard, ReviewsSummary (componentes existentes)
