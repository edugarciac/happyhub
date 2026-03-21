## Context

Infraestructura existente:
- **DB**: tabla `reviews` con `is_published BOOLEAN`, campos: id, reservation_id (FK unique), rating (1-5), review_text, customer_name, is_published, created_at, updated_at
- **APIs**: POST submit (auth), GET public list (is_published=true), GET stats, PATCH publish toggle, GET/DELETE admin
- **Componentes**: ReviewForm (rating + texto), ReviewCard, ReviewList (paginado), ReviewsSummary, StarRating
- **Admin**: reviews.tsx existe pero puede fallar si la tabla no está creada

Faltas: título en reviews, fotos, estados múltiples, página clients, sección home, formulario en área privada.

## Goals / Non-Goals

**Goals:**
- Migrar de boolean `is_published` a estados múltiples (`pending_review`, `published`, `archived`, `cancelled`)
- Admin puede gestionar estados de reseñas
- Usuarios pueden enviar reseñas con título, texto, rating y fotos
- Home muestra reseñas publicadas
- Página admin de clientes funcional

**Non-Goals:**
- No se implementa respuesta del admin a reseñas (futuro)
- No se notifica al usuario cuando su reseña cambia de estado (futuro)
- No se implementa edición de reseñas por el usuario (una vez enviada, no se modifica)
- No se implementa almacenamiento propio de fotos — se usará URL externa o base64 inicial

## Decisions

### Migrar is_published a status VARCHAR

**Decisión**: Reemplazar `is_published BOOLEAN` con `status VARCHAR(20)` y valores enum-like.

**Migración**: `UPDATE reviews SET status = CASE WHEN is_published THEN 'published' ELSE 'pending_review' END`, luego DROP is_published.

**Rationale**: 4 estados (pending_review, published, archived, cancelled) no caben en un boolean. Los datos existentes se migran sin pérdida.

### Transiciones de estado válidas

```
pending_review → [published, cancelled]
published      → [archived, cancelled]
archived       → [published]
cancelled      → [] (estado terminal)
```

### Fotos: URLs en campo JSONB

**Decisión**: Campo `photo_urls JSONB DEFAULT '[]'` en la tabla reviews. Las fotos se subirán a `/api/upload` y se guardarán las URLs.

**Alternativa**: Base64 en DB.

**Rationale**: URLs son más eficientes. Para MVP, se puede usar el directorio `public/uploads/reviews/` con Next.js API route para upload. Migrar a S3/Cloudinary después si necesario.

### Título obligatorio en reseñas

**Decisión**: Añadir columna `title VARCHAR(100) NOT NULL` a reviews.

**Rationale**: El usuario quiere que las reseñas tengan título. Se hace obligatorio para mantener calidad.

### Página de clientes: listado simple

**Decisión**: Página `/admin/clients` con listado de usuarios de la tabla `users`, mostrando: nombre, email, teléfono, rol, fecha registro, email verificado. Sin CRUD por ahora.

**Rationale**: No se especificó gestión completa de clientes. Un listado informativo cubre la necesidad inmediata.

### Reseñas en home: carrusel/grid limitado

**Decisión**: Mostrar máximo 6 reseñas publicadas en la home usando ReviewCard, con link "Ver todas" si hay más.

**Rationale**: No saturar la home. Las reseñas más recientes con rating alto primero.

## Risks / Trade-offs

- [Migración is_published → status] → Datos existentes se migran automáticamente, pero código que use `is_published` dejará de funcionar. Mitigación: actualizar todas las queries en el mismo deploy.
- [Fotos en public/uploads] → No escala y se pierde en redeploy de Vercel. Mitigación: para MVP es suficiente. Migrar a Cloudinary/S3 cuando haya volumen.
- [Título obligatorio retroactivo] → Reviews existentes no tienen título. Mitigación: migración pone título default 'Mi experiencia en Happyhub'.
