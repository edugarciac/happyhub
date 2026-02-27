## ADDED Requirements

### Requirement: Display aggregate review statistics prominently
The system SHALL show total review count and average rating in a prominent section on the homepage.

#### Scenario: Homepage shows review summary
- **WHEN** user views homepage and published reviews exist
- **THEN** system displays ReviewsSummary component with total count and average rating

#### Scenario: Review summary shows star visualization
- **WHEN** ReviewsSummary displays average rating
- **THEN** star rating component shows visual stars (e.g., 4.8 → 4.8/5 stars with visual)

#### Scenario: No reviews shows appropriate message
- **WHEN** no published reviews exist
- **THEN** ReviewsSummary shows "Sé el primero en valorarnos" or hides completely

### Requirement: Link to full reviews list
The system SHALL provide navigation from summary to full reviews page.

#### Scenario: Click summary to see all reviews
- **WHEN** user clicks on ReviewsSummary component
- **THEN** system navigates to /servicios#reviews or dedicated reviews page with all reviews
