## MODIFIED Requirements

### Requirement: Public pricing table display
The homepage pricing table (`PricingTable`) SHALL display only the Mañana and Tarde price columns for each day type. Night pricing data SHALL continue to exist in the database and pricing utilities but SHALL NOT be rendered in this table.

#### Scenario: Visitor views the homepage pricing table
- **WHEN** a visitor scrolls to the "Tarifas" section on the homepage
- **THEN** the table SHALL show columns for Día, Mañana, and Tarde only
- **AND** no "Noche" column SHALL be rendered

#### Scenario: Night pricing data remains available for future use
- **WHEN** night pricing fields exist in the pricing API response or database
- **THEN** they SHALL remain unchanged and usable by other parts of the system
- **AND** they SHALL simply not be displayed in the public pricing table
