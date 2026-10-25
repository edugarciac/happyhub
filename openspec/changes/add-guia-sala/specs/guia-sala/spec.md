## ADDED Requirements

### Requirement: Guía de la sala pública
The system SHALL serve a public page at `/guia-sala` listing questions and answers about using the venue, grouped by category.

#### Scenario: Cliente abre la guía
- **WHEN** a visitor opens `/guia-sala`
- **THEN** the page shows every category with its questions, inside the normal site header and footer

### Requirement: Búsqueda sin acentos
The guide SHALL filter questions by a free-text query matched against question and answer, ignoring case and diacritics.

#### Scenario: Búsqueda sin tilde
- **WHEN** the visitor types `musica`
- **THEN** questions containing "música" are shown expanded and non-matching ones are hidden

#### Scenario: Sin resultados
- **WHEN** no question matches
- **THEN** the page shows a message with the contact phone and WhatsApp

### Requirement: Filtro por categoría
The guide SHALL let the visitor restrict the list to one category, combinable with the search.

#### Scenario: Elegir categoría
- **WHEN** the visitor taps the "Música" chip
- **THEN** only questions of that category are listed

### Requirement: Variante para el panel de la tablet
The system SHALL serve `/guia-sala/panel` with the same content and search but without site header, footer, feedback widget or cookie banner.

#### Scenario: Panel de Home Assistant
- **WHEN** the Home Assistant dashboard embeds `/guia-sala/panel` in an iframe
- **THEN** the guide renders inside the frame without site chrome

### Requirement: Contenido compartido con /como-funciona
The FAQ categories shown on `/como-funciona` SHALL come from the same data module used by the guide.

#### Scenario: Editar una norma
- **WHEN** an answer in `src/data/faqs.ts` changes
- **THEN** both `/como-funciona` and `/guia-sala` show the new text

## MODIFIED Requirements

### Requirement: X-Frame-Options prevents clickjacking
The system SHALL include `X-Frame-Options: SAMEORIGIN` on every response except `/guia-sala/panel`, which SHALL instead send `Content-Security-Policy` with `frame-ancestors *` so it can be embedded by the venue panel.

#### Scenario: Embedding the panel guide
- **WHEN** a page on another origin embeds `/guia-sala/panel`
- **THEN** the browser renders the frame

#### Scenario: Embedding any other page
- **WHEN** a page on another origin embeds `/`
- **THEN** the browser refuses to render the frame
