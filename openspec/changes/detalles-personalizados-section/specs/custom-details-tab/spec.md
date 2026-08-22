## ADDED Requirements

### Requirement: Explanatory intro copy
The "Detalles personalizados" tab SHALL display introductory copy inviting the organizer to describe their idea, offering HappyHub's help to create personalized items for attendees so the event is unforgettable.

#### Scenario: Organizer opens the tab for the first time
- **WHEN** the organizer opens the "Detalles personalizados" tab with no data saved yet
- **THEN** the intro copy SHALL be visible above the form fields

### Requirement: Reminder text fields with character limits
The tab SHALL provide two short text inputs intended for use in the event's reminders: one limited to 25 characters and another limited to 40 characters. Both SHALL be enforced client-side (`maxLength`) and re-validated server-side on save.

#### Scenario: Organizer exceeds the character limit
- **WHEN** the organizer attempts to save a reminder text field longer than its limit (25 or 40 characters)
- **THEN** the client SHALL prevent typing beyond the limit, and the API SHALL reject a request exceeding it with a 400 response

### Requirement: Internal-only notes field
The tab SHALL provide a large free-text field for the organizer to describe what they want in detail. This field SHALL be stored and returned only to the authenticated organizer via the Detalles personalizados API, and SHALL NOT appear in guest-facing views, reminders, or any other endpoint.

#### Scenario: Organizer fills the internal notes field
- **WHEN** the organizer saves text in the internal notes field
- **THEN** the value SHALL be persisted and readable back by the organizer in this same tab
- **AND** no guest-facing page or reminder SHALL expose this value

### Requirement: Reference image upload
The tab SHALL allow the organizer to upload up to 2 reference images, reusing the existing image upload pattern (`ImageUpload` component and `/api/upload` endpoint).

#### Scenario: Organizer uploads a reference image
- **WHEN** the organizer selects an image file for one of the two image slots
- **THEN** the image SHALL be uploaded to the `custom-details` storage folder and its URL SHALL be saved for that slot

#### Scenario: Organizer removes an uploaded image
- **WHEN** the organizer removes a previously uploaded reference image
- **THEN** that image slot SHALL be cleared on save

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
