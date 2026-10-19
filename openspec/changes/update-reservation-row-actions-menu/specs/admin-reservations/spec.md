## MODIFIED Requirements

### Requirement: Reservation row actions are identifiable
The admin reservations list SHALL show only WhatsApp, Email and Edit as icon-only buttons per row, and SHALL group every other row action in a "Más" menu where each action has an icon and a visible text label.

#### Scenario: Admin opens the actions menu
- **WHEN** the admin clicks "Más" on a reservation row
- **THEN** a menu opens showing the available actions grouped under "Comunicación", "Pagos" and a separated red danger section, each with a text label

#### Scenario: Actions not applicable to the reservation
- **WHEN** an action's visibility condition is not met (e.g. "Señal recibida" for a non-approved reservation)
- **THEN** that action SHALL NOT appear, and empty sections SHALL be hidden

#### Scenario: Menu inside a horizontally scrollable table
- **WHEN** the menu opens on a row near the edge or bottom of the table
- **THEN** it SHALL be fully visible (not clipped) and close on outside click, Escape or scroll
