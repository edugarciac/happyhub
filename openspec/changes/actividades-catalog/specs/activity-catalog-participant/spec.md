## ADDED Requirements

### Requirement: Participants browse and add activities directly from the catalog
The Actividades tab SHALL let participants browse admin-curated catalog activities, filtered by the event's type when a match exists, and add one to the event with a single action.

#### Scenario: Browsing with a matching event type
- **WHEN** a participant opens the Actividades tab for an event whose category matches a known event type
- **THEN** the system shows catalog activities associated with that event type

#### Scenario: Browsing with no matching event type
- **WHEN** a participant opens the Actividades tab for an event whose category has no matching event type
- **THEN** the system shows the full, unfiltered catalog with a note that results are unfiltered

#### Scenario: Adding a catalog activity
- **WHEN** a participant clicks "Añadir" on a catalog activity
- **THEN** the system creates an event activity referencing that catalog entry and increments the catalog entry's usage count

### Requirement: Participants propose their own event activities for the shared catalog
The Actividades tab SHALL let the proposer of an event activity, or the event organizer, submit it as a proposal for inclusion in the admin-curated catalog.

#### Scenario: Proposing an activity
- **WHEN** the proposer of an event activity (or the organizer) submits it for the catalog
- **THEN** the system creates a pending proposal with a snapshot of the activity's title and description, visible to admins

#### Scenario: Preventing duplicate proposals
- **WHEN** an activity already has a pending proposal and its proposer attempts to propose it again
- **THEN** the system rejects the duplicate submission and shows the existing pending state

#### Scenario: Other participants cannot propose someone else's activity
- **WHEN** a participant who neither added the activity nor organizes the event attempts to propose it
- **THEN** the system denies the request
