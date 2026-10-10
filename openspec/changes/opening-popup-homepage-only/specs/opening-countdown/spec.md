## MODIFIED Requirements

### Requirement: Opening popup only on the homepage, once per day
The opening countdown popup SHALL only be shown on the homepage and, once dismissed, SHALL NOT reappear for 24 hours in the same browser, even in new tabs.

#### Scenario: Link from an email to an inner page
- **WHEN** a user opens `/pagar/...` or any page other than `/` from an email
- **THEN** the popup SHALL NOT be shown

#### Scenario: Homepage after dismissing
- **WHEN** a user dismissed the popup less than 24 hours ago and opens the homepage in a new tab
- **THEN** the popup SHALL NOT be shown
