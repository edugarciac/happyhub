## ADDED Requirements

### Requirement: Content-Security-Policy header on every response
The system SHALL include a `Content-Security-Policy` header on every HTTP response, restricting resource loading to trusted origins.

#### Scenario: Page load with CSP enforced
- **WHEN** a browser requests any page on happyhub.es
- **THEN** the response includes `Content-Security-Policy` with at least `default-src 'self'`, `script-src` allowing self, inline scripts, GTM, and Stripe, and `img-src` allowing self, data URIs, and HTTPS origins

#### Scenario: Cross-origin script blocked
- **WHEN** an injected script attempts to load from an unlisted origin
- **THEN** the browser blocks the script per CSP policy

### Requirement: X-Frame-Options prevents clickjacking
The system SHALL include `X-Frame-Options: SAMEORIGIN` on every response to prevent the site from being embedded in foreign iframes.

#### Scenario: Embedding attempt from foreign origin
- **WHEN** a third-party page tries to embed happyhub.es in an `<iframe>`
- **THEN** the browser refuses to render the frame

### Requirement: X-Content-Type-Options prevents MIME sniffing
The system SHALL include `X-Content-Type-Options: nosniff` to prevent browsers from guessing content types.

#### Scenario: Response with ambiguous content type
- **WHEN** a browser receives a response without an explicit `Content-Type`
- **THEN** the browser does not attempt to sniff or execute the content as a different type

### Requirement: Referrer-Policy limits referrer leakage
The system SHALL include `Referrer-Policy: strict-origin-when-cross-origin` to limit referrer information sent to third-party sites.

#### Scenario: Navigation to external site
- **WHEN** a user clicks a link to an external domain
- **THEN** only the origin (not full URL with path/query) is sent as the `Referer` header

### Requirement: Permissions-Policy disables unused browser APIs
The system SHALL include `Permissions-Policy` disabling camera, microphone, and geolocation APIs that HappyHub does not use.

#### Scenario: Script attempts to access camera
- **WHEN** any script (including injected ones) attempts to call `getUserMedia` for camera access
- **THEN** the browser denies access per Permissions-Policy
