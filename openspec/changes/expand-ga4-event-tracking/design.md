## Context

`src/lib/analytics.ts` ya expone `pageview(url)` y `event(action, params)` como wrappers finos sobre `window.gtag`. El consentimiento de cookies (`CookieConsent` / `useCookieConsent`) ya controla si el script de `gtag.js` se carga (`AnalyticsLoader` en `_app.tsx`), así que cualquier evento nuevo hereda automáticamente ese gate — no hace falta comprobar el consentimiento en cada sitio de llamada.

## Decisions

1. **Scroll depth como hook reutilizable, no como componente**: `useScrollDepthTracking()` vive en `src/lib/analytics.ts` junto al resto de utilidades de analytics, usa un `Set` en un `useRef` para no re-disparar el mismo umbral, y se resetea en cada `routeChangeComplete` (mismo evento que ya dispara `pageview`) para que cada página cuente su propio scroll.
2. **Section views vía IntersectionObserver con `once: true`**: cada sección relevante de `index.tsx` obtiene un `ref` observado con `threshold: 0.4` (40% visible) y dispara `section_view` una sola vez (se desconecta el observer tras el primer disparo) para no inflar el conteo con scroll hacia arriba/abajo repetido.
3. **CTA clicks como `onClick` adicional, no wrapper genérico**: se añade `onClick={() => gaEvent('cta_click', { cta_name: '...', location: '...' })}` directamente en cada botón/enlace existente, sin crear un componente `<TrackedButton>` — son ~8 sitios, no justifica la abstracción, y mantiene el comportamiento de cada enlace (algunos son `<Link>`, otros `<a>`) sin tocar su lógica de navegación.
4. **Naming**: `cta_name` usa snake_case descriptivo (`reserva_hero`, `reserva_pricing`, `reserva_cta_final`, `reserva_footer`, `whatsapp_hero`, `whatsapp_flotante`, `whatsapp_footer`, `solicitar_reserva_header`, `instagram_follow`) y `location` indica el componente (`Hero`, `PricingTable`, `Footer`, `Header`, `Home`) para poder filtrar en GA4 por parámetro.

## Risks / Trade-offs

- [Riesgo] Los botones "Solicitar Reserva" del Header pueden estar deshabilitados (gate por email allowlist, ver `canRequestReservation` en `Header.tsx`) — el evento solo debe dispararse en la versión clicable (`<Link>`), no en el `<span aria-disabled>`.
- [Riesgo] Doble disparo de `cta_click` si el usuario hace doble clic — aceptado, GA4 puede deduplicar/analizarse en el informe si hiciera falta, no se añade debounce por ahora (YAGNI).
