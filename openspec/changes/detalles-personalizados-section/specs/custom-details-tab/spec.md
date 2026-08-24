## ADDED Requirements

### Requirement: Explanatory intro copy
The "Detalles personalizados" tab SHALL display introductory copy inviting the organizer to describe their idea, offering HappyHub's help to create personalized items for attendees so the event is unforgettable.

#### Scenario: Organizer opens the tab for the first time
- **WHEN** the organizer opens the "Detalles personalizados" tab with no data saved yet
- **THEN** the intro copy SHALL be visible above the form fields

### Requirement: Reminder text fields with character limits [V1: not rendered]
The tab SHALL provide two short text inputs intended for use in the event's reminders: one limited to 25 characters and another limited to 40 characters. Both SHALL be enforced client-side (`maxLength`) and re-validated server-side on save.

In V1 these inputs are implemented but NOT rendered in `CustomDetailsTab` — the organizer cannot reach them from the UI. The underlying API validation (400 on exceeding the limit) SHALL remain in place for when the fields are re-enabled.

#### Scenario: Organizer exceeds the character limit (API-level, form not exposed in V1)
- **WHEN** a `PUT` request to the Detalles personalizados API includes a reminder text field longer than its limit (25 or 40 characters)
- **THEN** the API SHALL reject it with a 400 response, regardless of whether the UI currently exposes the field

### Requirement: Internal-only notes field [V1: not rendered]
The tab SHALL provide a large free-text field for the organizer to describe what they want in detail. This field SHALL be stored and returned only to the authenticated organizer via the Detalles personalizados API, and SHALL NOT appear in guest-facing views, reminders, or any other endpoint.

In V1 this field is implemented but NOT rendered — the organizer describes their idea via the WhatsApp contact link instead (see "WhatsApp contact CTA" below).

### Requirement: Reference image upload [V1: not rendered]
The tab SHALL allow the organizer to upload up to 2 reference images, reusing the existing image upload pattern (`ImageUpload` component and `/api/upload` endpoint).

In V1 this upload UI is implemented but NOT rendered — the `custom-details` folder stays whitelisted in `/api/upload.ts` for when it is re-enabled.

### Requirement: WhatsApp contact CTA
Below the idea gallery, the tab SHALL show a link to WhatsApp (reusing `CONTACT_INFO.whatsapp`) inviting the organizer to describe their idea directly, with copy noting that HappyHub knows professionals who can produce these items at a reasonable price. The link SHALL open in a new tab.

#### Scenario: Organizer wants to describe their idea
- **WHEN** the organizer opens the "Detalles personalizados" tab
- **THEN** a WhatsApp link SHALL be visible below the idea gallery
- **AND** activating it SHALL open a new tab to `CONTACT_INFO.whatsapp`

### Requirement: Curated idea gallery
The tab SHALL display a static, HappyHub-curated gallery of pre-conceived personalized item ideas (e.g. gorras, chapas, tazas, bolsos, vasos, camisetas, bolsitas neceser, peluches, botellas de agua) for inspiration. Each idea SHALL reserve visual space for a future photo, falling back to an icon/placeholder when no photo is set.

#### Scenario: Organizer browses idea gallery
- **WHEN** the organizer opens the "Detalles personalizados" tab
- **THEN** the gallery SHALL render each curated idea with its name and either its photo (if set) or a placeholder icon

### Requirement: Detalles personalizados API access control
Only an authenticated participant of the event may read the Detalles personalizados data, and only the organizer may create or update it.

#### Scenario: Organizer saves the form
- **WHEN** the organizer submits the Detalles personalizados form
- **THEN** the API SHALL upsert a single row per event and return the saved data

#### Scenario: Non-organizer participant attempts to save
- **WHEN** an authenticated participant who is not the organizer sends a save request
- **THEN** the API SHALL respond with 403 and SHALL NOT persist changes

#### Scenario: Unauthenticated request
- **WHEN** a request without a valid session hits the Detalles personalizados API
- **THEN** the API SHALL respond with 401
