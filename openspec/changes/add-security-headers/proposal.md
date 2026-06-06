## Why

HappyHub currently scores a D on security headers (securityheaders.com). Five important HTTP response headers are missing, leaving the browser without guidance on what resources are allowed, whether the site can be framed, and which browser APIs are available. This exposes users to XSS, clickjacking, and MIME-sniffing attacks.

## What Changes

- Add `Content-Security-Policy` to restrict which origins may load scripts, styles, images, and other resources
- Add `X-Frame-Options: SAMEORIGIN` to prevent clickjacking via `<iframe>` embedding
- Add `X-Content-Type-Options: nosniff` to prevent MIME-type sniffing
- Add `Referrer-Policy: strict-origin-when-cross-origin` to limit referrer data sent to third parties
- Add `Permissions-Policy` to disable browser APIs not used by HappyHub (camera, microphone, geolocation)

All headers are applied globally via `next.config.js` `headers()` matching `/(.*)`— no per-page changes needed.

## Capabilities

### New Capabilities
- `security-headers`: HTTP security headers applied to every response, improving browser-level protection against XSS, clickjacking, and MIME sniffing

### Modified Capabilities
- `next-config`: `next.config.js` extended with a `headers()` async function

## Impact

- **Infrastructure**: `next.config.js` only — no application code changes
- **Third-party scripts**: CSP must allow `googletagmanager.com` (GA4) and any CDN domains used by fonts/images
- **Score**: Expected improvement from D to A on securityheaders.com
