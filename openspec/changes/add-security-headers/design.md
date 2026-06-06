## Context

HappyHub is a Next.js 14 app deployed on Vercel. All HTTP responses pass through Vercel's edge network. Next.js supports injecting custom response headers globally via the `headers()` function in `next.config.js`, which is the recommended approach for Vercel deployments (alternative: `vercel.json` headers, but `next.config.js` keeps config co-located with the app).

The app uses:
- Google Tag Manager / GA4 (`googletagmanager.com`, `google-analytics.com`)
- Stripe.js (`js.stripe.com`)
- Google Fonts (loaded via Next.js or CSS)
- Instagram CDN for images (`scontent.cdninstagram.com`, `scontent-mad1-1.cdninstagram.com`)

## Goals / Non-Goals

**Goals:**
- Achieve an A rating on securityheaders.com
- Zero regressions: existing scripts, styles, fonts, and images must still load
- Single-file change (`next.config.js`)

**Non-Goals:**
- Nonce-based CSP (requires middleware rewrite, out of scope)
- Report-only mode / CSP violation reporting endpoint
- Removing `unsafe-inline` from `script-src` (requires full nonce migration)

## Decisions

### 1. Apply headers via next.config.js headers()

**Decision**: Use `headers()` in `next.config.js` with `source: '/(.*)'`.

**Rationale**: Single place for all security headers, version-controlled with the app, works on Vercel without additional config. `vercel.json` would duplicate config.

### 2. CSP allows unsafe-inline for scripts and styles

**Decision**: Include `'unsafe-inline'` in both `script-src` and `style-src`.

**Rationale**: Next.js 14 Pages Router injects inline scripts for hydration and inline styles via Tailwind. Removing `unsafe-inline` without nonce support would break the app. This is acceptable for now and still a significant improvement over having no CSP at all.

### 3. img-src includes https: wildcard

**Decision**: `img-src 'self' data: https:` allows images from any HTTPS origin.

**Rationale**: HappyHub loads images from Instagram CDN and potentially other partner domains. A wildcard for HTTPS images is a safe, practical choice that avoids future breakage when new image domains are added. `data:` is needed for Next.js Image component blur placeholders.

### 4. Stripe.js allowed in script-src and frame-src

**Decision**: Add `https://js.stripe.com` to `script-src` and `frame-src`.

**Rationale**: Stripe Checkout requires loading `stripe.js` from their CDN and may open payment iframes. Blocking these would break payments.

## Risks / Trade-offs

- **New third-party scripts**: Any future script from a domain not in the CSP will be silently blocked. Engineers must update the CSP when adding new external scripts.
- **unsafe-inline**: Partially weakens XSS protection. Acceptable trade-off until a nonce-based migration is done.
