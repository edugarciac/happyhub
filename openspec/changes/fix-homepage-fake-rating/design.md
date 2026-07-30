## Context

`GET /api/reviews/stats` ya existe y devuelve `{ success, stats: { average: number | null, count: number } }`, calculado solo sobre reviews con `status = 'published'`. El `Hero.tsx` actual (post `homepage-redesign`) no lo consume; muestra "4.9/5" fijo en un badge junto a "Hasta 50 personas" y "Respuesta en 24h".

## Goals / Non-Goals

**Goals:**
- Eliminar cualquier dato de valoración falso visible en la home.
- Mostrar la valoración real (`average` + `count`) en cuanto existan reseñas publicadas.

**Non-Goals:**
- No se rediseña el resto del Hero ni se toca `TrustBar.tsx` (no usado actualmente).
- No se cambia el modelo de datos ni las APIs de reviews, ya completas.

## Decisions

### Ocultar el bloque completo (icono + separador) cuando `count === 0`

**Decisión**: En vez de mostrar "0/5" o un placeholder, cuando `stats.count === 0` o `stats.average === null` no se renderiza ni el `<Star>` ni su separador "·" siguiente, para no dejar un separador huérfano al inicio de la fila.

**Rationale**: Es el mismo criterio ya acordado en `add-customer-ratings` (task 9.4) — coherente con "no reviews yet" en una plataforma que ni siquiera ha abierto.

### Fetch en `useEffect` sin loading state adicional

**Decisión**: Igual que el resto de la app (`ReservationForm.tsx`, `disponibilidad.tsx`), se hace `fetch('/api/reviews/stats')` en un `useEffect` y se guarda en `useState`. Mientras `stats` es `null` (todavía no ha resuelto la petición), tampoco se muestra el badge — evita un flash del "4.9/5" viejo entre el primer render y la respuesta.

## Risks / Trade-offs

- [Fetch client-side] → en el primer frame no se ve ninguna valoración aunque exista; aceptable, es un badge secundario y evita mostrar un dato incorrecto aunque sea por un instante.
