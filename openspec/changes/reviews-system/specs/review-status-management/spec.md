## ADDED Requirements

### Requirement: Review status field replaces is_published
El sistema SHALL usar un campo `status` con valores `pending_review`, `published`, `archived`, `cancelled` en vez del boolean `is_published`.

#### Scenario: Migration preserves existing data
- **WHEN** se ejecuta la migración
- **THEN** las reviews con `is_published=true` MUST tener `status='published'`
- **THEN** las reviews con `is_published=false` MUST tener `status='pending_review'`

### Requirement: Admin can transition review status
El sistema SHALL permitir al admin cambiar el estado de una reseña según las transiciones válidas.

#### Scenario: Admin publishes a pending review
- **WHEN** una reseña tiene estado `pending_review`
- **THEN** el admin MUST poder cambiarla a `published` o `cancelled`

#### Scenario: Admin archives a published review
- **WHEN** una reseña tiene estado `published`
- **THEN** el admin MUST poder cambiarla a `archived` o `cancelled`

#### Scenario: Admin republishes an archived review
- **WHEN** una reseña tiene estado `archived`
- **THEN** el admin MUST poder cambiarla a `published`

#### Scenario: Cancelled review is terminal
- **WHEN** una reseña tiene estado `cancelled`
- **THEN** el sistema MUST no mostrar botones de transición de estado

### Requirement: Admin reviews page shows all reviews with filters
La página `/admin/reviews` SHALL mostrar todas las reseñas con filtros por estado.

#### Scenario: Admin views reviews list
- **WHEN** el admin accede a `/admin/reviews`
- **THEN** el sistema MUST mostrar tabla con: título, cliente, rating (estrellas), estado, fecha, acciones
- **THEN** el sistema MUST permitir filtrar por estado (Todos, En revisión, Publicada, Archivada, Cancelada)

### Requirement: Status labels in Spanish
El sistema SHALL mostrar los estados con labels en español.

#### Scenario: Status display
- **WHEN** se muestra el estado de una reseña
- **THEN** `pending_review` MUST mostrarse como "En revisión"
- **THEN** `published` MUST mostrarse como "Publicada"
- **THEN** `archived` MUST mostrarse como "Archivada"
- **THEN** `cancelled` MUST mostrarse como "Cancelada"
