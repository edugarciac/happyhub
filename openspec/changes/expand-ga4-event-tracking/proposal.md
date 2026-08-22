## Why

El usuario solo veía visitas agregadas en Google Analytics y quiere saber qué hacen realmente los visitantes: qué secciones de la home ven, en qué CTAs hacen clic, y hasta dónde llegan haciendo scroll. El tracking de cambio de página (SPA) ya funciona (`router.events.on('routeChangeComplete', pageview)` en `_app.tsx`), pero no hay eventos de interacción ni de scroll depth, y la home (una sola página larga) no reporta qué secciones ve cada visitante.

## What Changes

- **Scroll depth**: nuevo hook `useScrollDepthTracking()` que dispara un evento GA4 `scroll_depth` (25/50/75/100%) una vez por umbral y por carga de página. Se engancha globalmente en `_app.tsx`.
- **Section views (home)**: `IntersectionObserver` en las secciones principales de `index.tsx` (Hero ya cuenta como pageview; Galería, Tarifas, Características, Tipos de evento, Instagram, CTA final) que dispara `section_view` con el nombre de la sección la primera vez que entra en viewport.
- **CTA clicks**: eventos `cta_click` con `{ cta_name, location }` en los botones/enlaces de conversión ya existentes: "Reserva tu fecha"/"Reservar ahora" (Hero, PricingTable, CTA final, Footer), "Solicitar Reserva" (Header), WhatsApp ("Cuéntanos tu idea", tarjeta flotante, Footer), y el enlace a Instagram.

## Out of Scope

- Cambios en la configuración del panel de GA4 (informes, audiencias, conversiones) — solo se instrumenta el sitio para que los datos existan
- Heatmaps o grabación de sesión (herramientas de terceros tipo Hotjar) — no se ha pedido
- Tracking en páginas de administración

## Capabilities

### Modified Capabilities

- `ga4-behavior-tracking`: eventos de interacción (scroll, secciones vistas, clics en CTAs) además del pageview ya existente

## Impact

- **Frontend**: `src/lib/analytics.ts` (nuevo hook), `src/pages/_app.tsx`, `src/pages/index.tsx`, `src/components/Hero.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/PricingTable.tsx`
- No hay cambios de backend ni de base de datos — todo se envía directamente a GA4 vía `window.gtag`
