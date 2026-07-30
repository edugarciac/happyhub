## MODIFIED Requirements

### Requirement: Calculate aggregate rating statistics
El sistema SHALL calcular la valoración media y el total de reseñas a partir únicamente de reseñas publicadas, y el Hero de la home SHALL reflejar ese dato real en lugar de un valor fijo.

#### Scenario: Aggregate statistics from published reviews
- **WHEN** el sistema calcula estadísticas de valoración vía `GET /api/reviews/stats`
- **THEN** devuelve la valoración media (redondeada a 1 decimal) y el conteo, solo de reseñas publicadas

#### Scenario: No reviews returns zero state
- **WHEN** no existen reseñas publicadas
- **THEN** el endpoint de stats devuelve `average: null, count: 0`

#### Scenario: Update homepage with real ratings
- **WHEN** la home carga y existen reseñas publicadas
- **THEN** el componente `Hero` MUST mostrar la valoración media calculada y el número de reseñas, no un valor hardcodeado

#### Scenario: Hide rating badge when there are no reviews
- **WHEN** la home carga y no existen reseñas publicadas (`count === 0` o `average === null`)
- **THEN** el componente `Hero` MUST no mostrar el badge de valoración (ni un "0/5" ni cualquier otro valor fijo)
