## ADDED Requirements

### Requirement: User can submit review from Area Privada
El sistema SHALL mostrar un botón "Publicar reseña" en el Área Privada para usuarios autenticados.

#### Scenario: User submits a review
- **WHEN** el usuario hace clic en "Publicar reseña"
- **THEN** el sistema MUST mostrar formulario con: título (obligatorio, max 100 chars), descripción (opcional, max 500 chars), rating 1-5 estrellas (obligatorio), opción de añadir fotos
- **WHEN** el usuario envía el formulario con datos válidos
- **THEN** el sistema MUST crear la reseña con `status='pending_review'`
- **THEN** el sistema MUST mostrar mensaje de confirmación

#### Scenario: Review requires title and rating
- **WHEN** el usuario intenta enviar sin título o sin rating
- **THEN** el sistema MUST mostrar errores de validación inline

### Requirement: Review title field
La tabla reviews SHALL incluir un campo `title VARCHAR(100) NOT NULL`.

#### Scenario: Title stored and displayed
- **WHEN** se crea una reseña con título
- **THEN** el título MUST guardarse en la columna `title`
- **THEN** el título MUST mostrarse en ReviewCard y en la tabla admin

### Requirement: Photo upload in reviews
El sistema SHALL permitir añadir fotos a una reseña.

#### Scenario: User uploads photos with review
- **WHEN** el usuario selecciona fotos al crear una reseña
- **THEN** el sistema MUST subir las fotos y guardar las URLs en `photo_urls JSONB`
- **THEN** las fotos MUST mostrarse en el ReviewCard público

#### Scenario: Photos are optional
- **WHEN** el usuario no añade fotos
- **THEN** el sistema MUST permitir enviar la reseña sin fotos
