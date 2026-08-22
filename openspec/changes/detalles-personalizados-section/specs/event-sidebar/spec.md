## MODIFIED Requirements

### Requirement: Simplified event sidebar
The event dashboard sidebar SHALL show only Invitados, Regalo, Música, Actividades, and Detalles personalizados as top-level, navigable sections, and SHALL be usable on mobile viewports without covering page content. Timeline SHALL remain implemented but SHALL NOT be linked from the sidebar navigation.

#### Scenario: Organizer opens event dashboard without a section query param
- **WHEN** a user opens `/mis-eventos/:id` with no `?section=` query parameter
- **THEN** the dashboard SHALL render the "Invitados" section by default, not Timeline

#### Scenario: Mobile visitor navigates sections
- **WHEN** a visitor on a narrow viewport opens an event
- **THEN** navigation SHALL be a bottom bar, not a persistent side rail, and SHALL NOT include a Timeline entry

#### Scenario: Visitor follows an old bookmarked Timeline link
- **WHEN** a user navigates directly to `/mis-eventos/:id?section=timeline`
- **THEN** the Timeline content SHALL still render (code and API routes are untouched), even though no sidebar entry links to it

### Requirement: Detalles personalizados label
The sidebar entry with `id: 'detalles'` SHALL display the label "Detalles personalizados" instead of "Detalles".

#### Scenario: Organizer reads sidebar labels
- **WHEN** a user views the event sidebar (desktop or mobile)
- **THEN** the section previously labeled "Detalles" SHALL read "Detalles personalizados"
