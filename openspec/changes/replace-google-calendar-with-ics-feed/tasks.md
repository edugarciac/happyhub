## 1. Feed

- [x] 1.1 `src/utils/icalendar.ts` (escape, fold, VEVENT/VTIMEZONE) + tests
- [x] 1.2 `src/lib/calendarFeed.ts` (token + query + events) and `GET /api/calendar/[file]`
- [x] 1.3 `GET /api/admin/calendar-feed` (URL for the admin) and "Calendario" dialog in the reservations page

## 2. Remove Google Calendar

- [x] 2.1 Delete `src/lib/googleCalendar.ts`, `src/pages/api/google-calendar-slots.ts`
- [x] 2.2 Remove calls in webhook-reserva, reservationNotifications, reservationFlow, reservation edit, status, block-dates, cancel-pending
- [x] 2.3 Privacy policy, `CLAUDE.md`, ADR

## 3. Verify

- [x] 3.1 `npx tsc --noEmit`, `npm test`
- [ ] 3.2 Subscribe from Google Calendar and Apple Calendar with the real URL
