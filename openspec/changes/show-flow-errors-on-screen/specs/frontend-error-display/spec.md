## ADDED Requirements

### Requirement: Display flow errors in reservation form
The frontend reservation form SHALL display error messages returned by the n8n flow to the user.

#### Scenario: Flow returns error
- **WHEN** the reservation API returns `{ "success": false, "error": "..." }`
- **THEN** the form SHALL display the `error` message in a visible error banner/alert

#### Scenario: Flow returns success with email warning
- **WHEN** the reservation API returns `{ "success": true, "emailWarning": "..." }`
- **THEN** the form SHALL show the success state AND display the email warning as an informational message

#### Scenario: Network or timeout error
- **WHEN** the API call fails due to network error or timeout
- **THEN** the form SHALL display "Error de conexion. Por favor, comprueba tu conexion e intentalo de nuevo."
