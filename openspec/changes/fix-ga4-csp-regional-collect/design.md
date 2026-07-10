## Context

`next.config.js` sets a CSP with `connect-src 'self' https://www.google-analytics.com https://analytics.google.com`. GA4's `gtag.js` (loaded from `googletagmanager.com`, itself correctly allowed under `script-src`) sends the actual pageview/event hit via `fetch`/`sendBeacon` to a regional collect host such as `region1.google-analytics.com` or `region1.analytics.google.com`, chosen based on visitor location/data-residency settings. CSP host-source matching does not match subdomains unless wildcarded, so the browser blocks the request — confirmed to be a widely-documented GA4 + CSP footgun.

## Goals / Non-Goals

**Goals:**
- GA4 hits reach Google regardless of which regional collect subdomain is used
- Keep CSP otherwise as restrictive as before

**Non-Goals:**
- Changing the cookie-consent gating logic
- Adding Google Consent Mode
- Adding Vercel Web Analytics or any other analytics provider

## Decisions

1. Replace the two exact `connect-src` hosts with wildcard equivalents: `https://*.google-analytics.com` and `https://*.analytics.google.com`. This covers `region1`/`region2`/`region3` (and any future regional prefixes) without needing to enumerate them.

## Risks / Trade-offs

- [Risk] Wildcarding is slightly broader than an exact host list → acceptable, still scoped to Google's own analytics domains, not open to arbitrary origins
