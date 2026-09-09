## ADDED Requirements

### Requirement: Overlay shown once per browser session
On first render of a public page in a new browser session, the app SHALL display a full-screen "coming soon" overlay unless the visitor has already dismissed it in that same session.

#### Scenario: First visit of the session
- **WHEN** a visitor loads any public page and `sessionStorage['happyhub_intro_dismissed']` is not set
- **THEN** the overlay SHALL be visible and SHALL block interaction with the page behind it (body scroll locked)

#### Scenario: Visitor already dismissed it this session
- **WHEN** a visitor navigates to another public page after having dismissed the overlay earlier in the same session
- **THEN** the overlay SHALL NOT be shown again until the browser session ends

### Requirement: Dismissible without losing access to the site
The overlay SHALL offer a way to close it and continue browsing, in addition to a WhatsApp contact CTA.

#### Scenario: Visitor closes the overlay
- **WHEN** a visitor clicks the close button (✕) or "Ver la web igualmente"
- **THEN** the overlay SHALL hide, `sessionStorage['happyhub_intro_dismissed']` SHALL be set, and body scroll SHALL be restored

#### Scenario: Visitor wants to be notified at opening
- **WHEN** a visitor clicks "Avísame cuando abráis"
- **THEN** a new tab SHALL open to HappyHub's WhatsApp contact link with a prefilled message asking when HappyHub opens

### Requirement: Overlay excluded from the admin panel
The overlay SHALL NOT render on `/admin` pages.

#### Scenario: Team member opens the admin panel
- **WHEN** a user navigates to any `/admin/*` route
- **THEN** the coming-soon overlay SHALL NOT be shown
