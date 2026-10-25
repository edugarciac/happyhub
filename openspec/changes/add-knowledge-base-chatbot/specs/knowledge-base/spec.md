## ADDED Requirements

### Requirement: Knowledge base stored as Markdown
FAQ and room guide content SHALL live in `content/kb/` as Markdown files with frontmatter (`title`, `category`, `tags`) and one `## ` heading per question followed by its answer.

#### Scenario: Editing a FAQ answer
- **WHEN** an answer is edited in a `content/kb/faq/*.md` file and deployed
- **THEN** `/como-funciona` SHALL show the new answer
- **AND** the chatbot SHALL use the new answer

#### Scenario: Adding a question
- **WHEN** a new `## ` heading with an answer is added to a KB file
- **THEN** it SHALL appear as a new collapsible question in its category

### Requirement: Pages read the KB at build time
`/como-funciona` and `/guia-sala` SHALL read `content/kb/` in `getStaticProps`; the FAQ SHALL no longer be hard-coded in the page component.

#### Scenario: Static generation
- **WHEN** the site is built
- **THEN** `/como-funciona` SHALL render every `category: faq` document ordered by `order`
- **AND** `/guia-sala` SHALL render every `category: guia-sala` document
- **AND** the Markdown parser SHALL not be included in the client bundle
