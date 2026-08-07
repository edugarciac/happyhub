## ADDED Requirements

### Requirement: Invitados tab presents a redesigned, mobile-friendly guest list
The Invitados tab SHALL present RSVP status as summary stat cards, render the guest list responsively (card layout on small screens, table on wider screens), and show an empty state with a primary call-to-action when there are no guests.

#### Scenario: Populated guest list
- **WHEN** an organizer with existing guests opens the Invitados tab
- **THEN** the system shows RSVP stat cards (confirmed/pending/declined/maybe) followed by the guest list in the layout appropriate to the viewport

#### Scenario: Empty guest list
- **WHEN** an organizer with zero guests opens the Invitados tab
- **THEN** the system shows an empty state with an explanation and a primary "Añadir invitado" call-to-action

### Requirement: General invite link points to a working join page
The copyable general invite link on the Invitados tab SHALL resolve to the actual join page for the event.

#### Scenario: Copying the invite link
- **WHEN** an organizer copies the general invite link from the Invitados tab and opens it
- **THEN** the link opens the event's join page (`/eventos/unirse/{inviteCode}`) rather than a non-existent route

## MODIFIED Requirements

### Requirement: RSVP-only guest page offers a path to full dashboard access
The RSVP page reached via a guest's personal invite token (`/invitacion/[token]`) SHALL, in addition to its existing RSVP form, present a call-to-action to create an account or log in, so the guest can subsequently reach the full event dashboard.

#### Scenario: Guest views RSVP page
- **WHEN** a guest opens their personal RSVP link
- **THEN** the system shows the existing RSVP form (confirm/decline/maybe + note) plus a call-to-action to register or log in

#### Scenario: Guest follows the account CTA
- **WHEN** a guest clicks "Crea tu cuenta" or "Inicia sesión" from the RSVP page and completes the flow
- **THEN** the system redirects them to the event's dashboard after authentication
