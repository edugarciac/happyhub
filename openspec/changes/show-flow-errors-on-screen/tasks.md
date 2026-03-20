## 1. n8n Flow Error Handling

- [x] 1.1 Add `onError: "continueErrorOutput"` to GuardarEnNeonDB and CrearEventoCalendar nodes
- [x] 1.2 Create error handler Function node that formats structured error response `{ success, error, step, code }`
- [x] 1.3 Add error response Webhook nodes for DB and Calendar failures (HTTP 500)
- [x] 1.4 Ensure GmailCliente/GmailAdmin keep `continueOnFail: true` and add `emailWarning` to success response when email fails

## 2. Frontend Error Display

- [x] 2.1 Update reservation form to parse and display `error` field from API response
- [x] 2.2 Handle `emailWarning` field — show success + informational warning
- [x] 2.3 Add network/timeout error handling with user-friendly Spanish message

## 3. Verify

- [ ] 3.1 Test DB failure scenario (e.g., malformed data) and confirm error shows on screen
- [ ] 3.2 Test Calendar failure scenario and confirm error shows on screen
- [ ] 3.3 Test email failure scenario and confirm reservation succeeds with warning
- [ ] 3.4 Test successful reservation end-to-end
