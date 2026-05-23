# Spec: Blocked Slots API

## GET /api/admin/block-dates

Returns all blocked slots ordered by date ascending.

**Auth**: Admin JWT required (getServerSession + authOptions)

**Response 200:**
```json
{
  "blockedSlots": [
    {
      "id": 1,
      "date": "2026-06-10",
      "timeSlot": "morning",
      "reason": "Mantenimiento HVAC",
      "createdBy": "admin@happyhub.es",
      "createdAt": "2026-05-23T10:00:00Z",
      "googleCalendarEventId": "abc123"
    }
  ]
}
```

**Query params:**
- `?includeHistory=true` — include slots with slot_date < today (default: false)

---

## POST /api/admin/block-dates

Creates blocked slots for a date range and selected time slots.

**Auth**: Admin JWT required

**Request body:**
```json
{
  "startDate": "2026-06-10",
  "endDate": "2026-06-12",
  "timeSlots": ["morning", "afternoon"],
  "reason": "Mantenimiento HVAC"
}
```

**Validation:**
- `startDate` required, valid ISO date
- `endDate` >= startDate (if omitted, defaults to startDate)
- `timeSlots` non-empty array, each value in ['morning', 'afternoon', 'night']
- `reason` optional string, max 500 chars

**Behavior:**
1. Expand range into individual (date, timeSlot) pairs
2. For each pair: INSERT INTO blocked_slots ... ON CONFLICT DO UPDATE SET reason, updated_at
3. For each inserted/updated slot: create Google Calendar event (fire-and-forget, log errors)
4. Store google_calendar_event_id per slot

**Response 200:**
```json
{
  "created": 6,
  "slots": [/* array of blocked slot objects */]
}
```

---

## DELETE /api/admin/block-dates

Deletes one or more blocked slots.

**Auth**: Admin JWT required

**Request body:**
```json
{ "ids": [1, 2, 3] }
```
(also accepts `{ "id": 1 }` for single deletion)

**Behavior:**
1. Fetch google_calendar_event_id for each id
2. Delete Google Calendar events (fire-and-forget)
3. DELETE FROM blocked_slots WHERE id = ANY($1)

**Response 200:**
```json
{ "deleted": 3 }
```

---

## PATCH /api/admin/block-dates/[id]

Updates the reason of a single blocked slot.

**Auth**: Admin JWT required

**Request body:**
```json
{ "reason": "Nuevo motivo" }
```

**Response 200:**
```json
{
  "updated": { /* blocked slot object */ }
}
```

**Response 404**: `{ "error": "Not found" }` if id doesn't exist

---

## GET /api/booked-slots (modified)

Returns all unavailable slots for the public booking calendar. Includes both active reservations and blocked slots.

**Auth**: None (public)

**Response 200** (unchanged contract):
```json
{
  "bookedSlots": [
    { "date": "2026-06-10T12:00:00.000Z", "timeSlot": "morning" },
    { "date": "2026-06-11T12:00:00.000Z", "timeSlot": "afternoon" }
  ]
}
```

---

## GET /api/admin/booked-slots (new)

Returns all unavailable slots with type differentiation for admin calendar.

**Auth**: Admin JWT required

**Response 200:**
```json
{
  "slots": [
    { "date": "2026-06-10T12:00:00.000Z", "timeSlot": "morning", "type": "reservation" },
    { "date": "2026-06-11T12:00:00.000Z", "timeSlot": "afternoon", "type": "blocked", "reason": "Mantenimiento" }
  ]
}
```
