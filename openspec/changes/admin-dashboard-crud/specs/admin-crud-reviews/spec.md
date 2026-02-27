## ADDED Requirements

### Requirement: List all reviews with admin visibility
The system SHALL display all reviews (published and unpublished) to admin users with pagination and filtering.

#### Scenario: Admin views all reviews
- **WHEN** admin navigates to /admin/reviews
- **THEN** system displays all reviews from reviews table with columns: ID, customer_name, rating, is_published, created_at

#### Scenario: Filter by publication status
- **WHEN** admin filters reviews by "Publicadas" or "Pendientes"
- **THEN** system displays only reviews matching is_published status

#### Scenario: Pagination for large datasets
- **WHEN** more than 20 reviews exist
- **THEN** system displays 20 reviews per page with pagination controls

### Requirement: Publish/unpublish reviews
The system SHALL allow admin to toggle is_published status with single click.

#### Scenario: Publish pending review
- **WHEN** admin clicks "Publicar" button on review with is_published=false
- **THEN** system updates is_published to true and refreshes list

#### Scenario: Unpublish published review
- **WHEN** admin clicks "Ocultar" button on review with is_published=true
- **THEN** system updates is_published to false and refreshes list

### Requirement: View full review details
The system SHALL display complete review information including reservation context.

#### Scenario: View review details
- **WHEN** admin clicks on a review row
- **THEN** system displays modal with: rating, review_text, customer_name, reservation details, created_at, updated_at

### Requirement: Delete reviews with confirmation
The system SHALL allow admin to delete reviews with mandatory confirmation prompt.

#### Scenario: Delete review with confirmation
- **WHEN** admin clicks delete icon and confirms in dialog
- **THEN** system deletes review from database and updates list

#### Scenario: Cancel delete operation
- **WHEN** admin clicks delete icon but cancels in confirmation dialog
- **THEN** system closes dialog without deleting review
