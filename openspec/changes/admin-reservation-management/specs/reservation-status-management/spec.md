## ADDED Requirements

### Requirement: Admin can change reservation status
The system SHALL allow admins to transition a reservation's status. The available statuses are: `pending`, `approved`, `rejected`, `cancelled`, `completed`.

#### Scenario: Admin changes status from pending to approved
- **WHEN** admin selects "Aprobar" on a reservation with status `pending`
- **THEN** the system updates the status to `approved` and refreshes the row

#### Scenario: Admin changes status from pending to rejected
- **WHEN** admin selects "Rechazar" on a reservation with status `pending`
- **THEN** the system updates the status to `rejected` and refreshes the row

#### Scenario: Admin cancels an approved reservation
- **WHEN** admin selects "Cancelar" on a reservation with status `approved`
- **THEN** the system updates the status to `cancelled` and refreshes the row

#### Scenario: Admin marks reservation as completed
- **WHEN** admin selects "Completar" on a reservation with status `approved`
- **THEN** the system updates the status to `completed` and refreshes the row

### Requirement: Status transitions follow allowed paths
The system SHALL enforce the following transition rules and reject any transition not listed:
- `pending` -> `approved`, `rejected`, `cancelled`
- `approved` -> `cancelled`, `completed`
- `rejected` -> `pending`
- `cancelled` -> `pending`
- `completed` -> (no transitions allowed, terminal state)

#### Scenario: Valid transition is accepted
- **WHEN** admin requests a transition that is in the allowed paths
- **THEN** the system performs the update and returns success

#### Scenario: Invalid transition is rejected
- **WHEN** admin requests a transition not in the allowed paths (e.g., `completed` -> `pending`)
- **THEN** the system responds with 400 status and error message "Transicion de estado no permitida"

### Requirement: Status is displayed with visual indicators
Each status SHALL be displayed with a distinct color badge in the reservation list:
- `pending`: yellow
- `approved`: green
- `rejected`: red
- `cancelled`: gray
- `completed`: blue

#### Scenario: Status badge renders correctly
- **WHEN** the reservation list loads
- **THEN** each reservation shows a color-coded badge matching its current status with the Spanish label (Pendiente, Aprobada, Rechazada, Cancelada, Completada)

### Requirement: Status change actions adapt to current status
The system SHALL only show valid transition actions for each reservation based on its current status. Actions that are not valid transitions SHALL NOT be displayed.

#### Scenario: Pending reservation shows available actions
- **WHEN** a reservation has status `pending`
- **THEN** the available actions are "Aprobar", "Rechazar", and "Cancelar"

#### Scenario: Completed reservation shows no status actions
- **WHEN** a reservation has status `completed`
- **THEN** no status transition actions are available (only edit, delete, and contact actions remain)
