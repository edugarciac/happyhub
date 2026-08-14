## ADDED Requirements

### Requirement: Admin reviews user-proposed catalog activities
The admin panel SHALL provide a queue of pending activity proposals submitted by event participants, letting an admin approve (publishing a new catalog entry) or reject each one.

#### Scenario: Approving a proposal
- **WHEN** an admin approves a pending proposal and assigns event types, participant types, and tags
- **THEN** the system creates a new catalog entry from the proposal's snapshotted title/description with the assigned metadata, and marks the proposal approved

#### Scenario: Rejecting a proposal
- **WHEN** an admin rejects a pending proposal
- **THEN** the system marks the proposal rejected without creating a catalog entry, and leaves the originating event activity unchanged

#### Scenario: Pending count visible
- **WHEN** an admin opens the catalog admin page and there are pending proposals
- **THEN** the system shows a badge with the pending count

## MODIFIED Requirements

### Requirement: Catalog activities are linked to real event types
The admin-managed activity catalog SHALL associate each entry with one or more entries from the platform's `event_types` table, rather than a free-text/hardcoded list.

#### Scenario: Admin tags a catalog entry
- **WHEN** an admin creates or edits a catalog entry and selects event types from the real event-types list
- **THEN** the system stores the association as references to `event_types` rows

#### Scenario: Legacy tag with no matching event type
- **WHEN** the system migrates a pre-existing catalog entry whose old text tag has no matching row in `event_types`
- **THEN** the system logs the entry for manual admin review instead of silently dropping the association
