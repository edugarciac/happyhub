import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { query, queryOne } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';

type TimeSlot = 'morning' | 'afternoon' | 'night';

const TIME_SLOT_HOURS: Record<TimeSlot, { start: string; end: string }> = {
  morning: { start: '10:00', end: '14:30' },
  afternoon: { start: '15:30', end: '20:30' },
  night: { start: '21:30', end: '02:00' },
};

function getCalendarClient() {
  const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID } = process.env;
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_CALENDAR_ID) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return { calendar: google.calendar({ version: 'v3', auth }), calendarId: GOOGLE_CALENDAR_ID };
}

async function createCalendarEvent(date: string, timeSlot: TimeSlot, reason: string | null): Promise<string | null> {
  const gcal = getCalendarClient();
  if (!gcal) return null;

  try {
    const { start, end } = TIME_SLOT_HOURS[timeSlot];
    const startDateTime = `${date}T${start}:00`;
    // Night slot ends next day
    const endDate = timeSlot === 'night'
      ? new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0]
      : date;
    const endDateTime = `${endDate}T${end}:00`;

    const event = await gcal.calendar.events.insert({
      calendarId: gcal.calendarId,
      requestBody: {
        summary: `🔒 [BLOQUEADO] ${reason || 'Mantenimiento'}`,
        description: reason || 'Fecha bloqueada por el admin de HappyHub.',
        start: { dateTime: startDateTime, timeZone: 'Europe/Madrid' },
        end: { dateTime: endDateTime, timeZone: 'Europe/Madrid' },
        colorId: '11', // Tomato (red-ish) to distinguish from reservations
      },
    });

    return event.data.id || null;
  } catch (err) {
    console.error('[block-dates] Error creating Google Calendar event:', err);
    return null;
  }
}

async function deleteCalendarEvent(eventId: string): Promise<void> {
  const gcal = getCalendarClient();
  if (!gcal || !eventId) return;

  try {
    await gcal.calendar.events.delete({ calendarId: gcal.calendarId, eventId });
  } catch (err) {
    console.error('[block-dates] Error deleting Google Calendar event:', err);
  }
}

function expandDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res, admin.email);
  }

  if (req.method === 'DELETE') {
    return handleDelete(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const includeHistory = req.query.includeHistory === 'true';

  const dateFilter = includeHistory ? '' : 'WHERE slot_date >= CURRENT_DATE';

  const result = await query<{
    id: number;
    slot_date: string;
    time_slot: TimeSlot;
    reason: string | null;
    created_by: string | null;
    created_at: string;
    google_calendar_event_id: string | null;
  }>(
    `SELECT id, TO_CHAR(slot_date, 'YYYY-MM-DD') AS slot_date, time_slot, reason,
            created_by, created_at, google_calendar_event_id
     FROM blocked_slots
     ${dateFilter}
     ORDER BY slot_date ASC, time_slot ASC`
  );

  return res.status(200).json({
    blockedSlots: result.rows.map((row) => ({
      id: row.id,
      date: row.slot_date,
      timeSlot: row.time_slot,
      reason: row.reason,
      createdBy: row.created_by,
      createdAt: row.created_at,
      googleCalendarEventId: row.google_calendar_event_id,
    })),
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, adminEmail: string) {
  const { startDate, endDate, timeSlots, reason } = req.body as {
    startDate: string;
    endDate?: string;
    timeSlots: TimeSlot[];
    reason?: string;
  };

  if (!startDate) {
    return res.status(400).json({ error: 'startDate es obligatorio' });
  }
  if (!timeSlots || timeSlots.length === 0) {
    return res.status(400).json({ error: 'Selecciona al menos una franja horaria' });
  }

  const validSlots: TimeSlot[] = ['morning', 'afternoon', 'night'];
  if (timeSlots.some((s) => !validSlots.includes(s))) {
    return res.status(400).json({ error: 'Franja no válida' });
  }

  const effectiveEndDate = endDate && endDate >= startDate ? endDate : startDate;
  const dates = expandDateRange(startDate, effectiveEndDate);

  const insertedSlots: any[] = [];

  for (const date of dates) {
    for (const timeSlot of timeSlots) {
      // Create Google Calendar event (fire-and-forget)
      const gcalEventId = await createCalendarEvent(date, timeSlot, reason || null);

      const row = await queryOne<{ id: number; slot_date: string; time_slot: string }>(
        `INSERT INTO blocked_slots (slot_date, time_slot, reason, created_by, google_calendar_event_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slot_date, time_slot) DO UPDATE
           SET reason = EXCLUDED.reason,
               updated_at = CURRENT_TIMESTAMP,
               google_calendar_event_id = COALESCE(EXCLUDED.google_calendar_event_id, blocked_slots.google_calendar_event_id)
         RETURNING id, TO_CHAR(slot_date, 'YYYY-MM-DD') AS slot_date, time_slot`,
        [date, timeSlot, reason || null, adminEmail, gcalEventId]
      );

      if (row) {
        insertedSlots.push({ id: row.id, date: row.slot_date, timeSlot: row.time_slot, reason: reason || null });
      }
    }
  }

  return res.status(200).json({ created: insertedSlots.length, slots: insertedSlots });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body as { id?: number; ids?: number[] };
  const ids: number[] = body.ids ?? (body.id !== undefined ? [body.id] : []);

  if (ids.length === 0) {
    return res.status(400).json({ error: 'Se requiere id o ids' });
  }

  // Fetch google_calendar_event_id before deleting
  const existing = await query<{ id: number; google_calendar_event_id: string | null }>(
    `SELECT id, google_calendar_event_id FROM blocked_slots WHERE id = ANY($1)`,
    [ids]
  );

  // Delete Google Calendar events
  for (const row of existing.rows) {
    if (row.google_calendar_event_id) {
      await deleteCalendarEvent(row.google_calendar_event_id);
    }
  }

  const result = await query(
    `DELETE FROM blocked_slots WHERE id = ANY($1)`,
    [ids]
  );

  return res.status(200).json({ deleted: result.rowCount ?? 0 });
}
