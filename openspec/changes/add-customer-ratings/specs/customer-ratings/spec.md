## ADDED Requirements

### Requirement: Submit rating for completed reservation
The system SHALL allow customers to submit a 1-5 star rating only for reservations with status 'confirmed' that have a past event_date.

#### Scenario: Customer submits valid rating
- **WHEN** a customer with a completed reservation submits a rating between 1-5 stars
- **THEN** the system creates a review record linked to that reservation

#### Scenario: Prevent rating for pending reservation
- **WHEN** a customer attempts to rate a reservation with status 'pending' or 'approved'
- **THEN** the system rejects the request with error message "Only completed events can be rated"

#### Scenario: Prevent rating for future event
- **WHEN** a customer attempts to rate a reservation with event_date in the future
- **THEN** the system rejects the request with error message "Event must be completed before rating"

#### Scenario: Prevent duplicate ratings
- **WHEN** a customer attempts to submit a second rating for the same reservation
- **THEN** the system rejects the request with error message "You have already rated this event"

### Requirement: Submit optional text review
The system SHALL allow customers to optionally include text feedback when submitting a rating.

#### Scenario: Submit rating with review text
- **WHEN** a customer submits a rating with optional review text (up to 500 characters)
- **THEN** the system stores both the rating and review text together

#### Scenario: Submit rating without review text
- **WHEN** a customer submits a rating without review text
- **THEN** the system stores only the rating with review_text as null

#### Scenario: Reject excessively long review
- **WHEN** a customer submits review text exceeding 500 characters
- **THEN** the system rejects with error "Review must be 500 characters or less"

### Requirement: Admin approval before publishing
The system SHALL require admin approval before any review becomes publicly visible.

#### Scenario: New review starts unpublished
- **WHEN** a customer submits a rating and review
- **THEN** the system sets is_published to false by default

#### Scenario: Admin approves review
- **WHEN** an admin user approves a review (sets is_published to true)
- **THEN** the review becomes visible in public review queries

#### Scenario: Only admins can publish
- **WHEN** a non-admin user attempts to change is_published status
- **THEN** the system rejects with error "Only administrators can moderate reviews"

### Requirement: Display published reviews
The system SHALL display only published reviews (is_published = true) in public views.

#### Scenario: Fetch published reviews
- **WHEN** a user requests the list of reviews via GET /api/reviews
- **THEN** the system returns only reviews where is_published = true, sorted by created_at descending

#### Scenario: Unpublished reviews hidden
- **WHEN** a review exists with is_published = false
- **THEN** that review does not appear in public API responses or UI

### Requirement: Calculate aggregate rating statistics
The system SHALL calculate average rating and total count from published reviews only.

#### Scenario: Aggregate statistics from published reviews
- **WHEN** the system calculates rating statistics via GET /api/reviews/stats
- **THEN** it returns average rating (rounded to 1 decimal) and count of published reviews only

#### Scenario: No reviews returns zero state
- **WHEN** no published reviews exist
- **THEN** the stats endpoint returns average: null, count: 0

#### Scenario: Update homepage with real ratings
- **WHEN** the homepage loads and published reviews exist
- **THEN** the Hero component displays the calculated average rating and review count instead of hardcoded 4.9

### Requirement: Associate reviews with customer identity
The system SHALL link each review to the customer who created it for authenticity and accountability.

#### Scenario: Store customer name with review
- **WHEN** a customer submits a review
- **THEN** the system stores the customer_name field from the reservation for display

#### Scenario: Authenticated submission only
- **WHEN** an unauthenticated user attempts to submit a review
- **THEN** the system rejects with 401 Unauthorized error

#### Scenario: Verify reservation ownership
- **WHEN** a customer attempts to rate a reservation not associated with their account
- **THEN** the system rejects with error "You can only rate your own reservations"
