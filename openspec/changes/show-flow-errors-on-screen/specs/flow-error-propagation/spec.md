## ADDED Requirements

### Requirement: Structured error response from n8n flow
The n8n reservation flow SHALL return a structured JSON error when any step fails, including the step name and a user-friendly message in Spanish.

#### Scenario: Database save fails
- **WHEN** the GuardarEnNeonDB node fails (connection error, constraint violation, etc.)
- **THEN** the flow SHALL respond with HTTP 500 and body `{ "success": false, "error": "Error al guardar la reserva en la base de datos. Por favor, intentalo de nuevo.", "step": "database", "code": 500 }`

#### Scenario: Google Calendar creation fails
- **WHEN** the CrearEventoCalendar node fails (auth error, API quota, etc.)
- **THEN** the flow SHALL respond with HTTP 500 and body `{ "success": false, "error": "Error al crear el evento en el calendario. Por favor, intentalo de nuevo.", "step": "calendar", "code": 500 }`

#### Scenario: Email send fails but reservation succeeds
- **WHEN** the GmailCliente or GmailAdmin node fails
- **THEN** the flow SHALL still respond with HTTP 200 (reservation is saved) but include `"emailWarning": "No se pudo enviar el email de confirmacion. Te contactaremos pronto."` in the response

### Requirement: Critical vs non-critical error handling
The flow SHALL distinguish between critical errors (DB, Calendar) that block the reservation and non-critical errors (Email) that do not.

#### Scenario: Critical error aborts flow
- **WHEN** a critical step (DB or Calendar) fails
- **THEN** the flow SHALL stop processing and return an error response immediately

#### Scenario: Non-critical error continues flow
- **WHEN** a non-critical step (Email) fails
- **THEN** the flow SHALL continue to the success response
