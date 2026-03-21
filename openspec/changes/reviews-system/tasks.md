## 1. Base de datos

- [ ] 1.1 Crear migración `006_reviews_status_and_fields.sql`: añadir `status VARCHAR(20)`, `title VARCHAR(100)`, `photo_urls JSONB DEFAULT '[]'`
- [ ] 1.2 Migrar datos: `is_published=true` → `status='published'`, `is_published=false` → `status='pending_review'`
- [ ] 1.3 Poner título default a reviews existentes: `'Mi experiencia en Happyhub'`
- [ ] 1.4 DROP columna `is_published` tras migración
- [ ] 1.5 Ejecutar migración en Neon

## 2. Backend — Adaptar APIs de reviews a status

- [ ] 2.1 Actualizar `src/pages/api/reviews/index.ts` (GET): filtrar por `status='published'` en vez de `is_published=true`
- [ ] 2.2 Actualizar `src/pages/api/reviews/index.ts` (POST): crear con `status='pending_review'`, aceptar title y photo_urls
- [ ] 2.3 Actualizar `src/pages/api/reviews/[id]/publish.ts` → convertir en endpoint genérico de cambio de estado con validación de transiciones
- [ ] 2.4 Actualizar `src/pages/api/admin/reviews.ts`: filtros por status en vez de is_published
- [ ] 2.5 Actualizar `src/pages/api/reviews/stats.ts`: filtrar por `status='published'`

## 3. Backend — API de clientes

- [ ] 3.1 Crear `src/pages/api/admin/clients.ts` con GET paginado, búsqueda por nombre/email, auth admin requerido

## 4. Backend — Upload de fotos

- [ ] 4.1 Crear `src/pages/api/upload.ts` para subir imágenes a `public/uploads/reviews/` y devolver URLs

## 5. Admin — Página de reseñas

- [ ] 5.1 Reescribir `src/pages/admin/reviews.tsx` con tabla de reseñas mostrando: título, cliente, rating, estado (badge color), fecha, acciones
- [ ] 5.2 Añadir filtro por estado (Todos, En revisión, Publicada, Archivada, Cancelada)
- [ ] 5.3 Añadir botones de acción contextuales por estado (Publicar, Archivar, Cancelar)
- [ ] 5.4 Implementar transiciones de estado con modales de confirmación

## 6. Admin — Página de clientes

- [ ] 6.1 Crear `src/pages/admin/clients.tsx` con tabla paginada: nombre, email, teléfono, rol, fecha registro, verificado
- [ ] 6.2 Añadir búsqueda por nombre/email
- [ ] 6.3 Mostrar contador total de clientes

## 7. Área Privada — Envío de reseñas

- [ ] 7.1 Añadir sección "Mis reseñas" o botón "Publicar reseña" en `src/pages/area-privada.tsx`
- [ ] 7.2 Actualizar `src/components/ReviewForm.tsx` para incluir campo título (obligatorio) y upload de fotos (opcional)
- [ ] 7.3 El formulario crea la reseña con `status='pending_review'` y muestra mensaje de confirmación

## 8. Home — Sección de reseñas públicas

- [ ] 8.1 Añadir sección de reseñas en `src/pages/index.tsx` debajo de la sección Instagram
- [ ] 8.2 Mostrar máximo 6 reseñas con `status='published'`, ordenadas por rating DESC
- [ ] 8.3 Actualizar `src/components/ReviewCard.tsx` para mostrar título y fotos
- [ ] 8.4 Añadir link "Ver todas las reseñas" si hay más de 6
