## Why

El `Hero` de la home muestra "⭐ 4.9/5 valoración" hardcodeado. HappyHub todavía no tiene reseñas reales (el espacio ni siquiera ha abierto: "Apertura Julio 2026"), así que ese dato es falso y mina la confianza. El cambio `add-customer-ratings` ya había resuelto esto conectando `Hero.tsx` a `/api/reviews/stats` y ocultando el badge sin reseñas (tasks 9.1-9.4), pero el rediseño posterior de la home (`homepage-redesign`) reescribió `Hero.tsx` desde cero y reintrodujo el valor hardcodeado sin pasar por esa spec. Esto es una regresión, no una feature nueva.

## What Changes

- `Hero.tsx` vuelve a calcular la valoración desde `GET /api/reviews/stats` en lugar de mostrar "4.9/5" fijo.
- Si no hay reseñas publicadas (`count === 0` o `average === null`), el bloque de valoración no se renderiza (ni el separador "·" asociado), en vez de mostrar un dato falso o un "0/5".
- No se toca `TrustBar.tsx`: no está importado en ninguna página, por lo que su "4.9/5" no llega a mostrarse en la home.

## Capabilities

### Modified Capabilities

- `customer-ratings`: se refuerza el requirement "Calculate aggregate rating statistics" para cubrir explícitamente el caso de la home rediseñada sin reseñas.

## Impact

- `src/components/Hero.tsx` — fetch de estadísticas reales y ocultación condicional del badge de valoración.
