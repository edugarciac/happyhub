## ADDED Requirements

### Requirement: Backdrop dismissal only on deliberate clicks
Admin modals SHALL close via the backdrop only when the pointer is both pressed and released on the backdrop itself.

#### Scenario: Text selection drag ends outside the modal
- **WHEN** an admin starts selecting text inside a modal input and releases the mouse over the backdrop
- **THEN** the modal SHALL remain open and the form values SHALL be preserved

#### Scenario: Deliberate click on the backdrop
- **WHEN** an admin presses and releases the mouse on the backdrop
- **THEN** the modal SHALL close

#### Scenario: Explicit close controls
- **WHEN** an admin clicks the X or Cancel button
- **THEN** the modal SHALL close
