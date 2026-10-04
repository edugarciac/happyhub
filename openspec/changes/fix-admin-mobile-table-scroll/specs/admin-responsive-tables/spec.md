## ADDED Requirements

### Requirement: Admin tables scroll horizontally on narrow screens
Admin tables SHALL be horizontally scrollable when wider than the viewport, so every column (including actions) stays reachable.

#### Scenario: Admin opens Partners on mobile
- **WHEN** an admin views `/admin/partners` on a phone-width viewport
- **THEN** partners SHALL be shown as cards with the edit and delete actions visible without horizontal scrolling
