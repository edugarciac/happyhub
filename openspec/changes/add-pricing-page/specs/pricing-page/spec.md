## ADDED Requirements

### Requirement: Pricing page
The site SHALL have a public `/precios` page rendering `PricingTable` with the current prices from the database.

#### Scenario: Visitor opens the pricing page
- **WHEN** a visitor opens `/precios`
- **THEN** the page SHALL show the same price table as the home page

### Requirement: Pricing entry in the main menu
The main navigation SHALL include a "Precio" item linking to `/precios`, on desktop and mobile.

#### Scenario: Navigating from the menu
- **WHEN** the visitor clicks "Precio" in the header
- **THEN** the browser SHALL navigate to `/precios` and the item SHALL be shown as active
