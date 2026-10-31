## ADDED Requirements

### Requirement: Internal content never reaches end users
The build SHALL fail if any public knowledge base document contains internal markers, and internal manual documents SHALL NOT declare public `pages`.

#### Scenario: Internal entity in the public guide
- **WHEN** a file in `content/kb/` mentions `script.encender_sala`
- **THEN** loading the public knowledge base SHALL throw an error naming the file and the marker

#### Scenario: Internal doc tries to publish
- **WHEN** a file in `content/interno/` declares `pages: [guia-sala]`
- **THEN** loading the internal manual SHALL throw an error

### Requirement: Documents grouped by topic with summaries
Every hub SHALL have a one-line `summary`; operations and explanations SHALL hang from a hub via `parent`; the internal manual index SHALL list the topics and all operations.

#### Scenario: Admin opens the manual
- **WHEN** an admin opens `/admin/manual`
- **THEN** they SHALL see the topics (hubs) with their summary and all operations with their "when"
- **AND** each topic page SHALL link to its sub-pages

#### Scenario: Chatbot context
- **WHEN** the chatbot prompt is built
- **THEN** each document SHALL start with its title, URL and summary
