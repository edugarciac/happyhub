## 1. Hero rating fix

- [x] 1.1 Añadir fetch de `GET /api/reviews/stats` en `useEffect` de `Hero.tsx`
- [x] 1.2 Renderizar valoración real (`average` + `count`) cuando `count > 0`
- [x] 1.3 Ocultar el badge de valoración (icono + separador) cuando `count === 0` o `average === null`, o mientras la petición no ha resuelto

## 2. Verificación

- [x] 2.1 `npm run build` sin errores
- [ ] 2.2 Verificación manual en navegador: sin reseñas no aparece "4.9/5"; con reseñas de prueba aparece la media real
