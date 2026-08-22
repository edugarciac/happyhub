## ADDED Requirements

### Requirement: Holiday list seeded from the official municipal calendar
The system SHALL provide a `holidays` table seeded with the 2026 official holiday calendar for Esplugues de Llobregat (Catalonia-wide holidays plus the municipality's 2 local holidays), tagged with `source = 'seed'`.

#### Scenario: Seed data present after migration
- **WHEN** the `021_create_holidays.sql` migration runs
- **THEN** the `holidays` table SHALL contain the 14 seeded 2026 dates with their names and `source = 'seed'`

### Requirement: Admin can list all holidays
The system SHALL provide an admin-only endpoint to list all holidays, including their date, name, source, and blocked status.

#### Scenario: Admin views the holiday list
- **WHEN** an authenticated admin requests `GET /api/admin/holidays`
- **THEN** the response SHALL include every holiday row ordered by date, each with `id`, `date`, `name`, `source`, and `blocked`

#### Scenario: Unauthenticated request rejected
- **WHEN** a request to `GET /api/admin/holidays` is made without a valid admin session
- **THEN** the system SHALL respond with 401 and no holiday data

### Requirement: Admin can add a custom holiday
The system SHALL allow an admin to create a new holiday with a date and a name, independent of the seeded calendar.

#### Scenario: Admin adds a custom holiday
- **WHEN** an admin submits `POST /api/admin/holidays` with a date and name not already present
- **THEN** the system SHALL create a new holiday row with `source = 'custom'` and return it

#### Scenario: Duplicate date rejected
- **WHEN** an admin submits a date that already exists in `holidays`
- **THEN** the system SHALL respond with a 400 error and not create a duplicate row

### Requirement: Admin can edit or delete any holiday
The system SHALL allow an admin to edit the date/name of any holiday (seeded or custom) and delete it, regardless of its source.

#### Scenario: Admin edits a seeded holiday
- **WHEN** an admin submits `PATCH /api/admin/holidays/{id}` with a corrected date or name for a `source = 'seed'` row
- **THEN** the system SHALL update the row and preserve its `source` value

#### Scenario: Admin deletes a holiday
- **WHEN** an admin submits `DELETE /api/admin/holidays/{id}`
- **THEN** the system SHALL remove the holiday row, and if it was blocked, remove its associated `blocked_slots` rows as well

### Requirement: Admin can block a holiday instead of pricing it differently
The system SHALL allow an admin to toggle a holiday between "priced as holiday" (default) and "blocked" (fully unavailable for booking).

#### Scenario: Admin blocks a holiday
- **WHEN** an admin submits `PATCH /api/admin/holidays/{id}` with `blocked: true`
- **THEN** the system SHALL set `holidays.blocked = true` and insert rows for all 3 time slots (morning, afternoon, night) on that date into `blocked_slots`, linked to the holiday
- **AND** those slots SHALL subsequently appear as unavailable via `/api/booked-slots` and `/api/admin/booked-slots`, identically to a manually blocked date

#### Scenario: Admin unblocks a holiday
- **WHEN** an admin submits `PATCH /api/admin/holidays/{id}` with `blocked: false` for a previously blocked holiday
- **THEN** the system SHALL set `holidays.blocked = false` and delete the `blocked_slots` rows previously created for that holiday
- **AND** the date SHALL become bookable again with holiday pricing applied
