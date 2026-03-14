## ADDED Requirements

### Requirement: GA4 script loads on every page
The system SHALL load the Google Analytics 4 gtag.js script on every page when the `NEXT_PUBLIC_GA_MEASUREMENT_ID` environment variable is set. The script SHALL load asynchronously to avoid blocking page rendering.

#### Scenario: GA configured in production
- **WHEN** `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set to a valid GA4 ID (e.g., `G-XXXXXXXXXX`)
- **THEN** the gtag.js script loads on every page and sends a `page_view` event on initial load

#### Scenario: GA not configured in development
- **WHEN** `NEXT_PUBLIC_GA_MEASUREMENT_ID` is not set or empty
- **THEN** no GA script is loaded and no analytics calls are made

### Requirement: Page views are tracked on SPA navigation
The system SHALL fire a `page_view` event to GA4 on every client-side route change, not just the initial page load.

#### Scenario: User navigates between pages
- **WHEN** a user navigates from `/` to `/reservas` via client-side navigation
- **THEN** the system fires a `page_view` event with `page_path: /reservas`

### Requirement: Key user events are tracked
The system SHALL track custom events for key user actions to enable funnel analysis in GA4.

#### Scenario: Booking funnel step
- **WHEN** a user advances to a step in the booking wizard
- **THEN** the system fires a `booking_step` event with the step number and name

#### Scenario: User registers
- **WHEN** a user completes registration
- **THEN** the system fires a `sign_up` event with method `email` or `google`

#### Scenario: User logs in
- **WHEN** a user logs in successfully
- **THEN** the system fires a `login` event with method `email` or `google`

#### Scenario: Contact form submission
- **WHEN** a user submits the contact form
- **THEN** the system fires a `contact_form_submit` event

### Requirement: Analytics calls are safe when GA is not configured
All analytics utility functions SHALL be no-ops when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is not set, so they can be called unconditionally from any component.

#### Scenario: Analytics call without GA configured
- **WHEN** code calls `event('sign_up', { method: 'email' })` and GA is not configured
- **THEN** the function returns silently without errors
