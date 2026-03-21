## ADDED Requirements

### Requirement: Reviews section on home page
La página home SHALL mostrar una sección de reseñas publicadas debajo de la sección de Instagram.

#### Scenario: Published reviews displayed
- **WHEN** un visitante accede a la home
- **THEN** el sistema MUST mostrar las últimas 6 reseñas con `status='published'`
- **THEN** cada reseña MUST mostrar: título, rating (estrellas), texto (truncado), nombre del cliente
- **THEN** las reseñas MUST ordenarse por rating DESC, created_at DESC

#### Scenario: No published reviews
- **WHEN** no hay reseñas con `status='published'`
- **THEN** el sistema MUST no mostrar la sección de reseñas

#### Scenario: More than 6 reviews
- **WHEN** hay más de 6 reseñas publicadas
- **THEN** el sistema MUST mostrar link "Ver todas las reseñas"

### Requirement: Only published reviews are public
El endpoint público de reseñas SHALL devolver únicamente reseñas con `status='published'`.

#### Scenario: API filters by status
- **WHEN** se llama a `GET /api/reviews`
- **THEN** el sistema MUST devolver solo reseñas con `status='published'`
- **THEN** el sistema MUST no devolver reseñas en estado `pending_review`, `archived` o `cancelled`
