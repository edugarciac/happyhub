## Why

Los eventos generan fotos que hoy se dispersan entre WhatsApp, Google Photos, y las galerias de cada movil. No hay un lugar unico donde todos los participantes compartan y vean las fotos del evento. HappyHub necesita un album compartido nativo para que la plataforma sea el punto central del evento, no solo de la reserva.

## What changes

- Album de fotos compartido por evento, accesible desde el detalle del evento
- Upload directo desde camara o galeria del movil
- Import desde WhatsApp (compartir foto/enlace hacia HappyHub)
- Import desde Google Photos (seleccionar album o fotos)
- Visualizacion en grid con lightbox
- Descarga individual y descarga completa del album
- Permisos: cualquier participante del evento puede subir, el organizador puede eliminar

## Capabilities

### New capabilities
- `event-photo-album`: Album compartido por evento con upload, visualizacion y descarga
- `photo-upload`: Upload directo desde camara/galeria con compresion automatica
- `photo-import-whatsapp`: Recibir fotos compartidas desde WhatsApp via deep link o share target
- `photo-import-google`: Importar fotos desde Google Photos via API

### Modified capabilities
- Area privada: mostrar preview de fotos recientes en el detalle de reserva

## Impact

**Database:**
- Nueva tabla `event_photos` (id, event_id, uploader_id, storage_key, thumbnail_key, original_filename, mime_type, size_bytes, width, height, taken_at, created_at)
- Indice por event_id para queries rapidas

**Storage:**
- S3 bucket o Cloudflare R2 para fotos originales y thumbnails
- Compresion server-side: original max 2048px lado largo, thumbnail 400px
- Presigned URLs para upload directo (evitar pasar por servidor)

**API endpoints:**
- `GET /api/events/[id]/photos` - Listar fotos del evento
- `POST /api/events/[id]/photos/upload-url` - Obtener presigned URL para upload
- `POST /api/events/[id]/photos/confirm` - Confirmar upload completado
- `DELETE /api/events/[id]/photos/[photoId]` - Eliminar foto (organizador)
- `GET /api/events/[id]/photos/download-all` - Generar ZIP con todas las fotos

**UI components:**
- `PhotoGrid` - Grid responsive de thumbnails con lightbox
- `PhotoUploader` - Boton de upload con drag-and-drop y seleccion multiple
- `PhotoImportModal` - Modal para importar desde Google Photos
- Album tab en la pagina de detalle del evento

**External integrations:**
- Google Photos API (read-only, seleccionar fotos)
- WhatsApp Web Share Target API (recibir fotos compartidas)
- S3/R2 presigned URLs

**Estimacion de coste storage:**
- Foto media comprimida: ~500KB
- 50 fotos/evento, 100 eventos/mes = 2.5GB/mes
- Cloudflare R2: ~$0.015/GB/mes = ~$0.04/mes (negligible)
