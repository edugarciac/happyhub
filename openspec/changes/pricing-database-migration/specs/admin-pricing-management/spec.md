## ADDED Requirements

### Requirement: List all pricing rules
The system SHALL allow an authenticated admin to view all pricing rules, including inactive ones.

#### Scenario: Admin views pricing list
- **WHEN** admin navigates to `/admin/pricing`
- **THEN** the system displays every row of `pricing_rules` with rule_name, day_type, time_slot, price, effective_from, effective_to and active status

#### Scenario: Non-admin or unauthenticated access
- **WHEN** a request to `/api/admin/pricing` is made without a valid admin session
- **THEN** the system returns 401 and does not expose pricing rule data

### Requirement: Create a pricing rule
The system SHALL allow an admin to create a new pricing rule from the admin UI.

#### Scenario: Admin creates a rule
- **WHEN** admin submits a new rule with rule_name, day_type, time_slot and a price >= 0
- **THEN** the system inserts the row and it appears in the list immediately

#### Scenario: Duplicate rule conflict
- **WHEN** admin submits a rule whose `(day_type, time_slot, effective_from)` combination already exists
- **THEN** the system returns a clear validation error instead of a raw database error

### Requirement: Edit a pricing rule
The system SHALL allow an admin to update the price and other fields of an existing rule.

#### Scenario: Admin updates a price
- **WHEN** admin edits the price of an existing rule and saves
- **THEN** the system updates the row's `price` and `updated_at`, and the new price is reflected by `GET /api/pricing/current` once the pricing cache expires (within 5 minutes)

#### Scenario: Invalid price rejected
- **WHEN** admin submits a negative price
- **THEN** the system rejects the update and shows a validation error

### Requirement: Toggle active state and delete a rule
The system SHALL allow an admin to deactivate or permanently delete a pricing rule.

#### Scenario: Admin deactivates a rule
- **WHEN** admin toggles a rule's active switch off
- **THEN** the system sets `active = false` and the rule is excluded from `GET /api/pricing/current`

#### Scenario: Admin deletes a rule
- **WHEN** admin confirms deletion of a rule
- **THEN** the system removes the row from `pricing_rules`
