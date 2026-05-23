## Why

The HappyHub booking system has no way to block dates or time slots for internal reasons (maintenance, private events, holidays). A provisional in-memory endpoint exists at `/api/admin/block-dates.ts` but loses all data on server restart. Admins currently cannot prevent clients from booking on dates reserved for internal use, leading to manual conflict resolution. This change delivers a persistent, fully-managed blocked-dates system integrated with the booking calendar and Google Calendar.

## What Changes

- Replace the in-memory `/api/admin/block-dates.ts` with a DB-backed implementation using a new `blocked_slots` table
- Modify `/api/booked-slots.ts` so that blocked slots appear as unavailable to clients (same as confirmed reservations)
- Create a new admin endpoint `/api/admin/booked-slots.ts` that returns reservations and blocked slots with type differentiation for the admin calendar view
- Add a "Bloquear fechas" button to the admin reservations page linking to a new CRUD management page
- Create `/admin/reservations/blocked-dates` — a full management page with date-range creation, listing, inline editing of reason, and bulk deletion
- Integrate with Google Calendar: create/delete events for blocked slots (distinct color from reservations)
- Update the admin calendar view to show blocked slots visually distinct from real reservations

## Capabilities

### New Capabilities
- `blocked-slots-persistence`: Blocked dates/time slots stored in PostgreSQL, survive server restarts
- `blocked-slots-crud`: Admin can create (date range + individual slots), read, update reason, and delete blocked slots
- `blocked-slots-calendar-visibility`: Blocked slots appear as unavailable in the public booking calendar
- `blocked-slots-admin-differentiation`: Admin calendar distinguishes blocked slots (amber) from real reservations (existing color)
- `blocked-slots-google-calendar`: Blocked slots create/delete Google Calendar events with a distinct color

### Modified Capabilities
- `booked-slots-api`: Now includes blocked slots in addition to active reservations

## Impact

- **Database**: New `blocked_slots` table (migration `010_create_blocked_slots.sql`)
- **API routes**: `/api/admin/block-dates.ts` replaced; `/api/booked-slots.ts` modified; `/api/admin/booked-slots.ts` and `/api/admin/block-dates/[id].ts` created
- **Frontend pages**: New `/admin/reservations/blocked-dates.tsx`; modified `/admin/reservations/index.tsx` and `/admin/calendar.tsx`
- **Google Calendar**: Uses existing calendar integration (same credentials/client as reservation approval flow)
- **Client booking flow**: No visible change — blocked slots appear as "No disponible" identically to reserved slots
