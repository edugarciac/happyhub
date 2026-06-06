## 1. next.config.js

- [ ] 1.1 Add `securityHeaders` array with all 5 headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- [ ] 1.2 Add `headers()` async function to `nextConfig` returning the security headers for `source: '/(.*)'`

## 2. Verification

- [ ] 2.1 Run `next build` — no errors or warnings related to headers config
- [ ] 2.2 Confirm all existing pages still load (no CSP violations for GA4, Stripe, Instagram images)
