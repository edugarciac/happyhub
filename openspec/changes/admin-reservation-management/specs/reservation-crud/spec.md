## ADDED Requirements

### Requirement: Admin can list reservations from database
The system SHALL display all reservations from the PostgreSQL database (not Stripe) in a paginated table, joined with user data for customer name, email, and phone. The list SHALL support filtering by status, date range, and free-text search (name, email, phone, reservation ID).

#### Scenario: Admin views reservation list
- **WHEN** admin navigates to `/admin/reservations`
- **THEN** the system displays reservations from the database with columns: reservation ID, customer name, email, phone, event date, time slot, event type, guests, total price, deposit, status, and action buttons

#### Scenario: Admin filters by status
- **WHEN** admin selects a status filter (pending, approved, rejected, cancelled, completed, or all)
- **THEN** the list shows only reservations matching that status

#### Scenario: Admin filters by date range
- **WHEN** admin sets a "from" and/or "to" date
- **THEN** the list shows only reservations whose event date falls within the range

#### Scenario: Admin searches by text
- **WHEN** admin types in the search box
- **THEN** the list filters to reservations matching the query against customer name, email, phone, or reservation ID

#### Scenario: Admin paginates through results
- **WHEN** there are more reservations than the page size (20)
- **THEN** the system displays pagination controls showing current range and total count

### Requirement: Admin can edit reservation details
The system SHALL allow admins to edit reservation fields: event date, time slot, event type, number of guests, total price, deposit amount, and notes. Edits SHALL be persisted to the database and the `updated_at` timestamp SHALL be refreshed.

#### Scenario: Admin opens edit form
- **WHEN** admin clicks the edit action on a reservation row
- **THEN** a modal opens pre-filled with the current reservation data

#### Scenario: Admin saves valid changes
- **WHEN** admin modifies fields and clicks save with valid data
- **THEN** the system updates the reservation in the database, closes the modal, and refreshes the list showing updated values

#### Scenario: Admin submits invalid data
- **WHEN** admin submits the edit form with invalid data (e.g., past date, negative guests, empty required fields)
- **THEN** the system displays validation errors and does not save

### Requirement: Admin can delete a reservation
The system SHALL allow admins to delete a reservation permanently after explicit confirmation. The deletion SHALL remove the row from the `reservations` table.

#### Scenario: Admin initiates deletion
- **WHEN** admin clicks the delete action on a reservation row
- **THEN** a confirmation dialog appears showing the reservation ID and customer name

#### Scenario: Admin confirms deletion
- **WHEN** admin confirms the deletion in the dialog
- **THEN** the system deletes the reservation from the database, closes the dialog, and refreshes the list

#### Scenario: Admin cancels deletion
- **WHEN** admin clicks cancel in the confirmation dialog
- **THEN** the reservation is not deleted and the dialog closes

### Requirement: Admin can print a personalized contract for a reservation
The system SHALL allow admins to generate and print a rental contract pre-filled with the customer and event data from the reservation. The contract is based on the template at `docs/contrato_alquiler_espacio.md` and is signed physically at the venue before the event.

#### Scenario: Admin clicks print contract
- **WHEN** admin clicks the "Imprimir contrato" action on a reservation row
- **THEN** the system opens a new browser tab with a print-ready HTML page containing the contract populated with: customer name, email, phone, event type, event date, time slot (with actual hours), number of guests, selected extras, base price, extras subtotal, total price, deposit amount (30%), security deposit (fianza), remaining balance, and reservation ID
- **AND** the browser print dialog opens automatically via `window.print()`

#### Scenario: Contract includes security deposit (fianza) clause
- **WHEN** the contract is generated
- **THEN** it includes the fianza clause with a configurable amount (default 200 EUR), a 15-day retention period after the event, and the damage assessment procedure (written notification with photos, deduction from fianza, right to claim the difference)

#### Scenario: Contract fields are formatted for print
- **WHEN** the contract is rendered
- **THEN** dates are in DD/MM/YYYY format, prices show EUR suffix, time slots display the actual hours (e.g., "Tarde: 16:30 - 20:30"), event types use their Spanish labels (Cumpleanos, Celebracion familiar, etc.), and extras are listed by name

#### Scenario: Reservation has missing optional data
- **WHEN** a reservation has no customer message or no extras
- **THEN** those fields display "Ninguno" or "-" instead of being blank

#### Scenario: Print-ready page layout
- **WHEN** the contract page is rendered
- **THEN** it uses A4-optimized CSS with print media queries, no header/footer/navigation, adequate margins for binding, and a clear signature area at the bottom with space for both parties

### Requirement: Admin API endpoints use database and require authentication
All admin reservation API endpoints SHALL query the PostgreSQL database directly. All endpoints SHALL require a valid JWT token with `role=admin`. Unauthorized requests SHALL receive a 401 or 403 response.

#### Scenario: Unauthenticated request
- **WHEN** a request is made to any admin reservation endpoint without a valid JWT
- **THEN** the system responds with 401 status and error message "No autorizado"

#### Scenario: Non-admin request
- **WHEN** a request with a valid JWT but `role != admin` is made
- **THEN** the system responds with 403 status and error message "Solo administradores pueden realizar esta accion"
