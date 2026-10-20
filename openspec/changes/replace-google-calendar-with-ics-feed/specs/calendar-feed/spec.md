## ADDED Requirements

### Requirement: Private iCalendar feed of reservations
The system SHALL serve at `/api/calendar/<token>.ics` an iCalendar feed with every reservation in status pending, approved, confirmed or completed whose event date is not older than 90 days, and every blocked slot not older than 30 days.

#### Scenario: Valid token
- **WHEN** a calendar app requests the feed with the valid token
- **THEN** it SHALL receive `text/calendar` with one VEVENT per reservation, starting and ending at the slot times in Europe/Madrid (plus extra hours), with the status in the title and the customer, contact, guests, extras, amounts and payment status in the description

#### Scenario: Invalid token
- **WHEN** the feed is requested with a wrong token
- **THEN** the system SHALL respond 404

#### Scenario: Reservation changes
- **WHEN** a reservation is approved, paid, moved or cancelled
- **THEN** the next feed request SHALL reflect it (cancelled reservations disappear) with the same UID

### Requirement: Admin can subscribe
The admin reservations page SHALL offer a "Calendario" button showing the feed URL, a copy button, a `webcal://` link and subscription instructions for Google Calendar and Apple Calendar.

## REMOVED Requirements

### Requirement: Google Calendar API sync
**Reason**: Not configured and replaced by the iCalendar feed.
**Migration**: Subscribe to the feed from Google Calendar ("Otros calendarios → Desde URL") or Apple Calendar.
