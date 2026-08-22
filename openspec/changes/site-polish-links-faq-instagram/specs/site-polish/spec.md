## ADDED Requirements

### Requirement: Footer links resolve to real destinations
All footer navigation links SHALL point to a real page or an anchor that exists in the DOM, and SHALL work when clicked from any page of the site, not only from the homepage.

#### Scenario: Clicking "Servicios" from a non-home page
- **WHEN** a visitor on `/contacto` clicks "Servicios" in the footer
- **THEN** they SHALL be navigated to the `/servicios` page

#### Scenario: Clicking "Preguntas frecuentes" in the footer
- **WHEN** a visitor clicks "Preguntas frecuentes" in the footer
- **THEN** they SHALL be navigated to `/como-funciona`, which contains the FAQ content

### Requirement: FAQ answers present in initial DOM
The FAQ accordion on `/como-funciona` SHALL render answer content in the DOM regardless of open/closed state, toggling only visibility, so the content is available to non-interactive readers (crawlers, screen readers, fetch-based tools).

#### Scenario: Fetching the FAQ page without executing JS
- **WHEN** the HTML of `/como-funciona` is fetched without running client JS
- **THEN** the answer text for each FAQ item SHALL be present in the HTML (even if visually hidden)

### Requirement: Instagram fallback copy is not "under construction"-sounding
When no Instagram posts are available to display, the fallback message SHALL invite the visitor to follow the account rather than imply the section is incomplete or unfinished.

#### Scenario: No Instagram token configured
- **WHEN** `INSTAGRAM_ACCESS_TOKEN` is not set and the homepage renders
- **THEN** the fallback message SHALL NOT contain the word "Proximamente"
