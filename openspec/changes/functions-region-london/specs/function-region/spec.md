## ADDED Requirements

### Requirement: Functions run next to the database
The system SHALL deploy serverless functions to the Vercel region closest to the Neon database (`lhr1` for `eu-west-2`).

#### Scenario: Production deployment
- **WHEN** a production deployment finishes
- **THEN** its functions region is `lhr1`
