## ADDED Requirements

### Requirement: Suggestions run on Claude Haiku 5.5
Gift and activity suggestions SHALL be generated with `claude-haiku-5-5` and SHALL read the answer from the response's text blocks, whatever blocks come before them.

#### Scenario: Response starts with a thinking block
- **WHEN** the model returns a thinking block followed by the JSON text
- **THEN** `generateText` SHALL return the JSON text

#### Scenario: Refused or cut-off response
- **WHEN** the response has `stop_reason` `refusal`, or ends at `max_tokens` without text
- **THEN** `generateText` SHALL throw an error and the API SHALL answer with an error message
