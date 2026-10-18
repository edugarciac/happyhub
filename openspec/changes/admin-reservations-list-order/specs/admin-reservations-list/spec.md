## ADDED Requirements

### Requirement: Reservations list order and creation time
The admin reservations list SHALL be ordered by reservation code (id) descending and SHALL show the creation date and time of each reservation.

#### Scenario: Newest reservation first
- **WHEN** reservations #41 (event in December) and #42 (event next week) exist
- **THEN** #42 SHALL appear before #41

#### Scenario: Creation time
- **WHEN** a reservation was created on 18/10/2026 at 17:05 Madrid time
- **THEN** the list SHALL show "18/10/2026, 17:05" under its code
