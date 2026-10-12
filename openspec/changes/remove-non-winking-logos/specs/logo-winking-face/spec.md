## MODIFIED Requirements

### Requirement: Logo face matches official design
All HappyHub logo assets in the repository (`public/`, `src/`) that render the bubble face SHALL show the winking expression; no asset with the old non-winking face SHALL remain.

#### Scenario: Favicon
- **WHEN** any page loads
- **THEN** the favicon and apple-touch-icon (`/favicon.png`) SHALL show the winking face on a square canvas

#### Scenario: Open Graph preview
- **WHEN** a page link is shared
- **THEN** `og:image` SHALL point to a winking-face logo (`/happyhub_logo_white.png`)

#### Scenario: No legacy assets
- **WHEN** searching the repo for logo/favicon images
- **THEN** none SHALL show the non-winking face
