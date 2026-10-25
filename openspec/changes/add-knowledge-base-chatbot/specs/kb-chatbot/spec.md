## ADDED Requirements

### Requirement: Chat endpoint grounded in the knowledge base
`POST /api/chat` SHALL answer using the full KB content in the system prompt and SHALL NOT invent information outside the KB and its tools.

#### Scenario: Question covered by the KB
- **WHEN** a visitor asks "¿Cuál es la política de cancelación?"
- **THEN** the reply SHALL match the cancellation answer in the KB

#### Scenario: Question not covered
- **WHEN** the visitor asks something the KB and tools do not cover, or asks for a person
- **THEN** the reply SHALL say so and offer WhatsApp
- **AND** the response SHALL include `handoff: true`

### Requirement: Prices and availability come from the database
The chatbot SHALL obtain prices and availability only through tools that query the database, never from the KB files.

#### Scenario: Price question
- **WHEN** the visitor asks the price of a Saturday afternoon
- **THEN** the chatbot SHALL call `get_pricing` and answer with the active `pricing_rules` price

#### Scenario: Availability question
- **WHEN** the visitor asks whether a date is free
- **THEN** the chatbot SHALL call `check_availability` and answer from `reservations` and `blocked_slots`
- **AND** SHALL link to `/disponibilidad` to book
- **AND** SHALL NOT reveal any data about other customers' reservations

### Requirement: Abuse limits
The endpoint SHALL reject requests beyond the per-IP rate limit, with more than 20 messages, or with messages over 1 000 characters.

#### Scenario: Rate limit exceeded
- **WHEN** an IP exceeds the rate limit
- **THEN** the API SHALL return 429 and the widget SHALL offer WhatsApp

### Requirement: Chat widget
A chat widget SHALL be available on public pages and open by default on `/guia-sala/panel`; it SHALL NOT be shown on `/admin` pages.

#### Scenario: Handoff button
- **WHEN** a reply has `handoff: true`
- **THEN** the widget SHALL show a "Hablar por WhatsApp" button opening `CONTACT_INFO.whatsapp`
