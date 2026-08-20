## ADDED Requirements

### Requirement: Public holiday dates endpoint
The system SHALL expose a public endpoint returning the full list of holiday dates, for use by pricing calculations in the booking flow.

#### Scenario: Client fetches holiday dates
- **WHEN** any client calls `GET /api/holidays`
- **THEN** the system SHALL respond with the list of all holiday dates (`YYYY-MM-DD`) from the `holidays` table, without requiring authentication

### Requirement: Holiday-aware pricing driven by the database
The system SHALL determine whether a date is a holiday (for pricing purposes) using the `holidays` table instead of a hardcoded, year-specific date list.

#### Scenario: Date added by admin affects pricing immediately
- **WHEN** an admin adds a new holiday date via the admin UI
- **AND** a client subsequently loads the booking flow (fresh fetch of `/api/holidays`)
- **THEN** that date SHALL be priced using the `holiday_morning`/`holiday_afternoon` pricing rules

#### Scenario: Date removed by admin stops being priced as a holiday
- **WHEN** an admin deletes a holiday date via the admin UI
- **AND** a client subsequently loads the booking flow (fresh fetch of `/api/holidays`)
- **THEN** that date SHALL be priced according to its ordinary weekday/weekend/Friday rules, not the holiday rules

#### Scenario: Holiday-eve pricing still resolves correctly
- **WHEN** a date's following day is present in `/api/holidays`
- **THEN** `isHolidayEve()` SHALL return true for that date, preserving the existing Friday/holiday-eve afternoon pricing tier

### Requirement: Resilience if the holiday API is unreachable
The system SHALL fall back to a hardcoded holiday list if `/api/holidays` cannot be reached, so pricing calculation does not break entirely.

#### Scenario: Holiday fetch fails
- **WHEN** `GET /api/holidays` fails (network error or non-2xx response)
- **THEN** `isHoliday()` SHALL fall back to the bundled default holiday list instead of throwing or treating every date as a non-holiday
