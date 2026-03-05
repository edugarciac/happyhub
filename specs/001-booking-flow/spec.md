# Feature Specification: Calendar & Booking Flow Improvements

**Feature Branch**: `001-booking-flow`
**Created**: 2026-03-05
**Status**: Implemented
**Input**: HappyHub calendar and booking flow improvements

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check availability and book directly (Priority: P1)

A visitor lands on HappyHub, clicks "Reserva tu fecha" from anywhere on the site, sees the calendar with real-time availability pulled from the database, selects a date and time slot, and proceeds directly to configure their event — without having to pick the date a second time.

**Why this priority**: This is the primary booking path. Every friction point removed here directly increases conversion.

**Independent Test**: Navigate to `/reservas`, verify the calendar shows slots from the database, click an available slot, verify it turns dark green, click "Continuar", verify Step 2 shows the correct price.

**Acceptance Scenarios**:

1. **Given** a visitor on any page, **When** they click "Reserva tu fecha", **Then** they land on the booking wizard at Step 1 (calendar).
2. **Given** the booking calendar is open, **When** reservations exist in the database with status `pending` or `approved`, **Then** those date/slot combinations appear in red and cannot be clicked.
3. **Given** an available slot, **When** the visitor clicks it, **Then** the slot turns dark green with a ring indicator and the legend reflects the selected state.
4. **Given** a slot is selected, **When** the visitor clicks "Continuar", **Then** Step 2 opens showing the correct base price for that date and time slot.

---

### User Story 2 - Navigate from external link without re-selecting date (Priority: P2)

A visitor who arrives at the booking wizard via a direct link containing a preselected date and time slot skips the calendar step and lands directly on Step 2 (Configuration) with the price already calculated.

**Why this priority**: Reduces unnecessary steps for visitors arriving from targeted campaigns or shared links with a specific date in mind.

**Independent Test**: Navigate to `/reservas?date=YYYY-MM-DD&timeSlot=afternoon`, verify Step 2 opens directly showing the correct base price.

**Acceptance Scenarios**:

1. **Given** a URL with `date` and `timeSlot` query parameters, **When** the visitor opens the booking wizard, **Then** Step 1 is skipped and Step 2 is shown.
2. **Given** Step 2 opened via preselected parameters, **When** the page renders, **Then** the base price displayed matches the pricing rules for that date and time slot.
3. **Given** a URL without query parameters, **When** the visitor opens the booking wizard, **Then** Step 1 (calendar) is shown as normal.

---

### User Story 3 - Redirect from legacy availability URL (Priority: P2)

A visitor who navigates to the old `/disponibilidad` URL (bookmarked, shared, or indexed) is automatically redirected to the booking wizard without seeing an error.

**Why this priority**: Prevents dead-end navigation for visitors with existing bookmarks or external links.

**Independent Test**: Navigate to `/disponibilidad`, verify immediate permanent redirect to `/reservas`.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to `/disponibilidad`, **When** the page loads, **Then** they are permanently redirected to `/reservas`.
2. **Given** a redirect from `/disponibilidad`, **When** it arrives at `/reservas`, **Then** the booking wizard loads correctly at Step 1.

---

### User Story 4 - Consistent navigation labelling across the site (Priority: P3)

All calls-to-action and navigation items related to booking consistently say "Reserva tu fecha" and point to `/reservas`. No duplicate buttons appear on any page.

**Why this priority**: Brand consistency and reduced cognitive load. Duplicate buttons signal confusion and erode trust.

**Independent Test**: Visit home, hero section, footer, `/como-funciona`, and the pricing table — verify exactly one booking CTA per section, all labelled "Reserva tu fecha".

**Acceptance Scenarios**:

1. **Given** a visitor on the home page, **When** they look for a booking CTA, **Then** they see exactly one "Reserva tu fecha" button in each section (no duplicates).
2. **Given** the site navigation menu, **When** viewed on any page, **Then** the menu item reads "Reserva tu fecha" and links to `/reservas`.
3. **Given** the footer, **When** the visitor looks at the navigation links, **Then** "Reserva tu fecha" appears once and points to `/reservas`.

---

### Edge Cases

- What happens when the database is unavailable when loading the calendar? → Calendar loads showing all slots as available (fail-open) to avoid blocking bookings.
- What happens when a visitor navigates to `/reservas` without a preselected date? → Wizard starts at Step 1 (calendar selection).
- What happens with time zone differences between server and client? → Dates are transmitted at noon UTC to prevent day-boundary shifts across time zones.
- What happens if the page renders server-side with no query parameters yet available? → The booking wizard renders only on the client to avoid server/client HTML mismatches.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The calendar MUST display slots from the reservations database as unavailable (red) when their status is `pending` or `approved`.
- **FR-002**: The calendar MUST only show future slots as bookable; past dates MUST be non-interactive.
- **FR-003**: When a visitor selects an available slot, it MUST visually distinguish itself from available (light green) and unavailable (red) slots using dark green with a ring indicator.
- **FR-004**: The calendar legend MUST show three states: Available (light green), Selected (dark green), and Reserved (red).
- **FR-005**: When the booking wizard opens with a preselected date and time slot, it MUST start at Step 2 (Configuration), skipping Step 1.
- **FR-006**: Step 2 MUST display the correct base price for the preselected date and time slot, calculated from the active pricing rules, even when Step 1 was skipped.
- **FR-007**: The page `/disponibilidad` MUST permanently redirect to `/reservas`.
- **FR-008**: All navigation items, buttons, and CTAs linking to the booking flow MUST be labelled "Reserva tu fecha".
- **FR-009**: No page in the site MUST display duplicate booking CTAs.
- **FR-010**: The booking wizard MUST render without errors in server-side rendered environments.

### Key Entities

- **Reservation**: A booking record with an event date, a time slot (morning/afternoon/night), and a status (pending/approved/rejected). Pending and approved reservations block the corresponding calendar slot.
- **Time Slot**: One of three daily periods — morning (11:00–14:30), afternoon (16:30–20:30), night (22:00–02:00).
- **Pricing Rule**: A rule keyed by day type and time slot (e.g., weekend afternoon) that determines the base price shown in Step 2.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can go from landing on the site to reaching Step 2 of the booking wizard in 2 clicks or fewer.
- **SC-002**: The calendar reflects database availability within the same page load — no manual refresh required.
- **SC-003**: Zero duplicate booking CTAs appear on any page of the site.
- **SC-004**: Visitors with bookmarked `/disponibilidad` URLs reach the booking wizard without seeing an error page.
- **SC-005**: The base price shown in Step 2 matches the pricing rules for the selected date and slot 100% of the time, regardless of whether the user arrived via Step 1 or a direct link.
- **SC-006**: The booking wizard loads without errors on both server-rendered and client-only page loads.
