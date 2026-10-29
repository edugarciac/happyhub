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

### Requirement: Numeric inputs can be fully cleared while editing
Numeric form inputs (amounts, guests, sort order) SHALL allow the field to be empty while the user retypes the value.

#### Scenario: Admin retypes the total price
- **WHEN** an admin deletes the whole value of the total price field
- **THEN** the field SHALL be empty (not `0`) until a new value is typed

#### Scenario: Saving with an empty amount
- **WHEN** an admin saves a reservation edit with the total price or deposit empty
- **THEN** the save SHALL be blocked with a message asking to fill in the amount

#### Scenario: Customer leaves the guests field empty
- **WHEN** a customer empties the guests field in booking step 2 and leaves it
- **THEN** the field SHALL revert to the last valid guest count
