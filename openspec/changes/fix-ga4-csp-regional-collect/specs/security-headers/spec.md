## MODIFIED Requirements

### Requirement: Content-Security-Policy header on every response
The system SHALL include a `Content-Security-Policy` header on every HTTP response, restricting resource loading to trusted origins. `connect-src` SHALL allow GA4's regional collect subdomains in addition to the base Google Analytics hosts.

#### Scenario: GA4 regional collect request allowed
- **WHEN** `gtag.js` sends a measurement hit to a regional endpoint such as `https://region1.google-analytics.com/g/collect` or `https://region1.analytics.google.com/g/collect`
- **THEN** the browser permits the request per the `connect-src` directive (does not block it as a CSP violation)

#### Scenario: Cross-origin script blocked
- **WHEN** an injected script attempts to load from an unlisted origin
- **THEN** the browser blocks the script per CSP policy
