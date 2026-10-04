## ADDED Requirements

### Requirement: Quick activate/deactivate partner
The admin partners list SHALL offer a one-tap control to toggle each partner's active state.

#### Scenario: Admin deactivates a partner
- **WHEN** an admin taps the power button on an active partner
- **THEN** the partner SHALL be marked inactive and no longer shown on the public `/partners` page

### Requirement: Delete only from edit
Permanent deletion SHALL only be available from the partner edit modal, behind a confirmation that warns it is irreversible.
