# Tasks: event-photos

## MVP (implementado)
- [x] Migración tabla `event_photos` (ver `database/migrations/015_reminders_and_photos.sql`)
- [x] `POST /api/events/collaborative/[id]/photos` — registrar foto subida (usa `/api/upload` + S3 existente)
- [x] `GET /api/events/collaborative/[id]/photos` — listar fotos del evento
- [x] `DELETE /api/events/collaborative/[id]/photos/[photoId]` — eliminar foto (organizador o quien la subió)
- [x] Componente `PhotoAlbumSection.tsx` — grid responsive + lightbox + upload + borrado
- [x] Sección "Fotos" activada en `src/pages/mis-eventos/[id].tsx`

## Fuera de alcance (futuro)
- [ ] Presigned URLs para upload directo a S3 (evitar pasar por servidor)
- [ ] Import desde WhatsApp / Google Photos
- [ ] Descarga ZIP del álbum completo
- [ ] Compresión/generación de thumbnails server-side
