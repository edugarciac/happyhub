## ADDED Requirements

### Requirement: Internal manual for administrators only
The site SHALL serve the internal manual from `content/interno/` at `/admin/manual` and `/admin/manual/<slug>`, only to users whose session has role `admin`, checking the session on the server before reading the content.

#### Scenario: Admin opens the manual
- **WHEN** an admin opens "Manual interno" in the admin menu
- **THEN** the manual index SHALL list its operations and documents

#### Scenario: Visitor without an admin session
- **WHEN** a visitor without a session, or a customer, requests `/admin/manual` or any manual page or its `/_next/data` JSON
- **THEN** the server SHALL redirect to `/login`
- **AND** the response SHALL NOT contain any manual content

### Requirement: Internal content kept out of public surfaces
Public pages and the customer chatbot SHALL only read `content/kb/`; `content/interno/` SHALL never be loaded by them.

#### Scenario: Public build
- **WHEN** the public knowledge base is loaded
- **THEN** it SHALL contain no document from `content/interno/`

### Requirement: Same format and validation as the public KB
Internal documents SHALL use the KB frontmatter and types, and the same build-time checks (broken links, operation template).

#### Scenario: Broken internal link
- **WHEN** an internal document links to a missing internal document
- **THEN** loading the manual SHALL fail naming the file and the link
