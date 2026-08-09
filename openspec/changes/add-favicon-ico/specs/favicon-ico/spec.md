## ADDED Requirements

### Requirement: Site serves a valid .ico favicon
The site SHALL serve a valid multi-resolution `.ico` favicon at `/favicon.ico`, matching the HappyHub logo already used as favicon, and SHALL reference it explicitly in the document head.

#### Scenario: Direct request to /favicon.ico
- **WHEN** a browser or crawler requests `/favicon.ico` directly (default browser behavior with no explicit `<link>`)
- **THEN** the server SHALL respond with a valid `.ico` image (not a 404)

#### Scenario: Page load references the icon
- **WHEN** any page loads
- **THEN** the document head SHALL include a `<link rel="icon" href="/favicon.ico">` in addition to the existing PNG favicon link
