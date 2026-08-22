## ADDED Requirements

### Requirement: Scroll depth tracking
The site SHALL send a GA4 `scroll_depth` event the first time a visitor scrolls past 25%, 50%, 75%, and 100% of a page's height, at most once per threshold per page view.

#### Scenario: Visitor scrolls to the bottom of the homepage
- **WHEN** a visitor scrolls from top to bottom of `/`
- **THEN** four `scroll_depth` events SHALL fire, one each for 25, 50, 75, and 100, each exactly once

### Requirement: Homepage section view tracking
The homepage SHALL send a GA4 `section_view` event the first time each major section (gallery, pricing, features, event types, Instagram, final CTA) becomes at least 40% visible in the viewport.

#### Scenario: Visitor scrolls through the homepage once
- **WHEN** a visitor scrolls from the hero to the footer without scrolling back up
- **THEN** each section SHALL report exactly one `section_view` event with its section name

### Requirement: CTA click tracking
Primary conversion actions (reservation CTAs, WhatsApp links, the header's "Solicitar Reserva", and the Instagram follow link) SHALL send a GA4 `cta_click` event with `cta_name` and `location` parameters when clicked.

#### Scenario: Visitor clicks "Reserva tu fecha" in the Hero
- **WHEN** a visitor clicks the Hero's primary CTA
- **THEN** a `cta_click` event SHALL fire with `cta_name: "reserva_hero"` and `location: "Hero"`

#### Scenario: Disabled "Solicitar Reserva" does not fire an event
- **WHEN** a visitor without booking access sees the disabled "Solicitar Reserva" span
- **THEN** no `cta_click` event SHALL fire, since the element is not clickable
