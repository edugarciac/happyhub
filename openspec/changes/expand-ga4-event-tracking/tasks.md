## 1. Analytics helpers

- [x] 1.1 Add `useScrollDepthTracking()` hook to `src/lib/analytics.ts`
- [x] 1.2 Wire the hook into `_app.tsx`, resetting fired thresholds on `routeChangeComplete`

## 2. Homepage section views

- [x] 2.1 Add `useSectionView(name)` helper (IntersectionObserver, fires once) to `src/lib/analytics.ts`
- [x] 2.2 Apply it to Gallery, Tarifas, Características, Tipos de evento, Instagram, and final CTA sections in `index.tsx`

## 3. CTA click events

- [x] 3.1 Hero.tsx: "Reserva tu fecha" and "Cuéntanos tu idea" (WhatsApp) buttons (+ floating WhatsApp card)
- [x] 3.2 Header.tsx: "Solicitar Reserva" (only the enabled `<Link>` variant, desktop + mobile)
- [x] 3.3 PricingTable.tsx: "Reserva tu fecha" CTA
- [x] 3.4 index.tsx: final CTA "Reservar ahora" and Instagram follow link
- [x] 3.5 Footer.tsx: WhatsApp link, "Reserva tu fecha" link, Instagram icon link

## 4. Verify

- [x] 4.1 `npx tsc --noEmit` and `npm run build` pass
- [ ] 4.2 Manual check in browser devtools (Network tab, filter `collect`) that events fire on scroll/click with correct params — deferred to production check post-deploy
