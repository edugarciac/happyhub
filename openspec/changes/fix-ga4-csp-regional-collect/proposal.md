## Why

Google Analytics 4 shows zero traffic in Realtime even for visitors who accept the cookie banner. The `gtag.js` script itself loads fine (allowed by CSP `script-src`), but GA4 sends the actual measurement hit to a regional collect endpoint (e.g. `region1.google-analytics.com`, `region1.analytics.google.com`) rather than the bare `www.google-analytics.com` / `analytics.google.com` hosts. The CSP `connect-src` in `next.config.js` only whitelists the exact hosts, not the regional subdomains, so the browser silently blocks every hit with a CSP violation. Analytics has effectively never recorded a single pageview in production.

## What Changes

- Widen `connect-src` in `next.config.js`'s CSP to `https://*.google-analytics.com` and `https://*.analytics.google.com` so regional GA4 collect endpoints are not blocked
- Widen `img-src`/`script-src` are already broad enough (`https:` and specific host) — no change needed there

## Capabilities

### Modified Capabilities
- `security-headers`: `connect-src` directive widened to allow GA4's regional collect subdomains

## Impact

- **Infrastructure**: `next.config.js` only — no application code changes
- **Analytics**: Restores GA4 data collection for all EU/regional visitors
