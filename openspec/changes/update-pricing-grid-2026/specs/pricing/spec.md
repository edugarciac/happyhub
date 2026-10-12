## MODIFIED Requirements

### Requirement: Base price by day type and time slot
The system SHALL compute the base price of a bookable slot from the active `pricing_rules` using this grid:

| Day type | Morning rule | Afternoon rule |
|---|---|---|
| Holiday or holiday eve | `holiday_morning` | `holiday_afternoon` |
| Saturday / Sunday | `weekend_morning` | `weekend_afternoon` |
| Friday | `weekday_morning` | `friday_afternoon` |
| Monday–Thursday | `weekday_morning` | `weekday_afternoon` |

Rows are evaluated top to bottom. A rule with price 0 or a missing rule SHALL yield "A consultar".

#### Scenario: Weekday prices
- **WHEN** a Tuesday that is not a holiday nor a holiday eve is selected
- **THEN** morning SHALL cost 120 € and afternoon 130 €

#### Scenario: Friday prices
- **WHEN** a Friday that is not a holiday eve is selected
- **THEN** morning SHALL cost 120 € and afternoon 180 €

#### Scenario: Weekend prices
- **WHEN** a Saturday or Sunday that is not a holiday nor a holiday eve is selected
- **THEN** morning SHALL cost 160 € and afternoon 200 €

#### Scenario: Holiday eve is "A consultar"
- **WHEN** the day after the selected date is a holiday
- **THEN** both morning and afternoon SHALL show "A consultar"

#### Scenario: Holiday is "A consultar"
- **WHEN** the selected date is a holiday
- **THEN** both morning and afternoon SHALL show "A consultar"

#### Scenario: "A consultar" cannot be booked online
- **WHEN** a user selects a slot whose price is "A consultar"
- **THEN** the booking flow SHALL NOT continue and SHALL invite the user to contact the venue

### Requirement: Public pricing table
The public pricing table SHALL show the rows "Lunes a jueves", "Viernes", "Sábados y domingos" and "Festivos y vísperas".

#### Scenario: Visitor views the pricing table
- **WHEN** a visitor views the "Tarifas" section
- **THEN** the "Festivos y vísperas" row SHALL show "A consultar" in both columns
