## ADDED Requirements

### Requirement: Partner card shows a large centered image
The `/partners` page SHALL show each partner's image at 160 px, centered at the top of its card, followed by the name, service type and description.

#### Scenario: Partner with image
- **WHEN** a visitor opens `/partners` and a partner has an image
- **THEN** the image appears large and centered above the name and description

#### Scenario: Partner without image
- **WHEN** a partner has no image
- **THEN** a placeholder of the same size is shown so the cards stay aligned
