## Context

HappyHub is a Next.js 14 SPA with Pages Router. Page transitions are client-side, so the default gtag.js snippet only captures the initial page load. We need to fire `page_view` events on every route change. The site is deployed on AWS Amplify.

## Goals / Non-Goals

**Goals:**
- Track all page views including SPA navigations
- Track key funnel events (booking steps, registration, login, contact)
- Configurable via env var so analytics are disabled in development
- Zero impact on page load performance (async script loading)

**Non-Goals:**
- Cookie consent banner (separate future task)
- Server-side analytics or custom dimensions
- E-commerce tracking for Stripe payments
- User ID tracking (privacy)

## Decisions

### 1. GA4 via gtag.js (not Google Tag Manager)

**Decision**: Use the standard gtag.js snippet directly, not GTM.

**Rationale**: GTM adds complexity (a separate container to manage) for features we don't need. gtag.js is simpler, lighter, and sufficient for page views + custom events.

### 2. Script loading in _document.tsx

**Decision**: Add the gtag.js `<script>` tags in `_document.tsx` `<Head>` with `async` and `strategy="afterInteractive"` semantics. Use Next.js `<Script>` component in `_app.tsx` for better control.

**Rationale**: `_document.tsx` renders once on the server. Using Next.js `<Script>` with `afterInteractive` strategy ensures the GA script doesn't block rendering.

### 3. Route change tracking in _app.tsx

**Decision**: Listen to `router.events` `routeChangeComplete` in `_app.tsx` to fire `gtag('config', GA_ID, { page_path })` on every navigation.

**Rationale**: Standard pattern for Next.js Pages Router SPA analytics. Captures all client-side navigations.

### 4. Analytics utility module

**Decision**: Create `src/lib/analytics.ts` with helper functions `pageview(url)` and `event(action, params)` that check for the GA ID before calling `gtag`.

**Rationale**: Centralizes all GA calls, makes it safe to call from anywhere (no-op when GA is not configured), and keeps components clean.

## Risks / Trade-offs

- **Ad blockers**: Some users block GA. Acceptable since we only need aggregate data, not 100% coverage.
- **GDPR**: GA4 anonymizes IP by default and data is processed in the EU (configurable). Basic analytics under legitimate interest is acceptable for now, but a cookie banner should be added later for full compliance.
