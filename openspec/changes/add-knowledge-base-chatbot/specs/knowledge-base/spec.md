## ADDED Requirements

### Requirement: Single knowledge base for FAQ and room guide
FAQ and room guide content SHALL live in one Markdown collection in `content/kb/`. Each question SHALL exist in only one document, and each document SHALL declare in `pages` where it is shown (`como-funciona`, `guia-sala` or both).

#### Scenario: Rule shown in both places
- **WHEN** a document in `normas.md` has `pages: [como-funciona, guia-sala]`
- **THEN** its questions SHALL appear in `/como-funciona` and in `/guia-sala` from the same source

#### Scenario: Editing an answer
- **WHEN** an answer is edited in a KB file and deployed
- **THEN** every page showing it and the chatbot SHALL use the new answer

### Requirement: Hub and detail pages
Documents SHALL have a `type` of `hub`, `detalle` or `operacion`. Hubs SHALL give short answers and link to detail documents; every document SHALL have its own page at `/guia-sala/<slug>`.

#### Scenario: Following a link
- **WHEN** a hub links to `zonas/sala-kids.md`
- **THEN** the rendered link SHALL point to `/guia-sala/zonas/sala-kids`

#### Scenario: Broken link
- **WHEN** a KB link points to a document that does not exist
- **THEN** the build SHALL fail naming the file and the link

### Requirement: Control panel as the starting point
`/guia-sala` SHALL start with the control panel hub, which explains the functionalities grouped by type and the grouped-action buttons.

#### Scenario: Opening the guide
- **WHEN** a customer opens `/guia-sala`
- **THEN** the first section SHALL be "Panel de control" with links to its operations

### Requirement: Operations section with a common template
`/guia-sala` SHALL list every `operacion` document in an "Operaciones" section. Each operation SHALL have `when` in its frontmatter and the sections "Para qué sirve", "Cuándo usarla", "Pasos", "Qué hace" and "Si algo falla".

#### Scenario: Operation listed
- **WHEN** `operaciones/encender-sala.md` exists
- **THEN** "Encender sala" SHALL appear in Operaciones with its `when` text and link to its page

#### Scenario: Operation missing a section
- **WHEN** an operation lacks a required section
- **THEN** the build SHALL fail naming the file and the missing section

### Requirement: Pages read the KB at build time
`/como-funciona`, `/guia-sala` and `/guia-sala/<slug>` SHALL read `content/kb/` at build time; the FAQ SHALL no longer be hard-coded in the page component, and the Markdown parser SHALL not be included in the client bundle.

#### Scenario: Static generation
- **WHEN** the site is built
- **THEN** `/como-funciona` SHALL render the documents with `como-funciona` in `pages`, ordered by `order`

### Requirement: Kiosk guide embeddable from Home Assistant
`/guia-sala/panel` SHALL render the guide without the site header, footer or menu, and SHALL be embeddable in an iframe only from the site itself and the configured Home Assistant origin. All other routes SHALL keep `X-Frame-Options: SAMEORIGIN`.

#### Scenario: Help button on the room tablet
- **WHEN** a customer taps "Ayuda" on the Home Assistant panel
- **THEN** the iframe SHALL load `/guia-sala/panel` starting with "Panel de control" and the chat open

#### Scenario: Embedding from another site
- **WHEN** a page from any other origin embeds `/guia-sala/panel`
- **THEN** the browser SHALL block it through `frame-ancestors`
