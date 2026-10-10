import { google } from 'googleapis';

// Cuenta de servicio de Google (no caduca, a diferencia del OAuth de n8n).
// El calendario GOOGLE_CALENDAR_ID debe estar compartido con GOOGLE_CLIENT_EMAIL con permiso de edición.

const SLOT_HOURS: Record<string, { start: string; end: string }> = {
  morning: { start: '10:00', end: '14:00' },
  afternoon: { start: '16:00', end: '20:00' },
};

function getClient() {
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

export async function createReservationEvent(params: {
  date: string;
  timeSlot: string;
  summary: string;
  description: string;
}): Promise<string | null> {
  const gcal = getClient();
  const hours = SLOT_HOURS[params.timeSlot];
  if (!gcal || !hours) return null;

  try {
    const event = await gcal.calendar.events.insert({
      calendarId: gcal.calendarId,
      requestBody: {
        summary: params.summary,
        description: params.description,
        location: 'Happyhub - C/ Rovellat, 27, 08950 Esplugues de Llobregat',
        start: { dateTime: `${params.date}T${hours.start}:00`, timeZone: 'Europe/Madrid' },
        end: { dateTime: `${params.date}T${hours.end}:00`, timeZone: 'Europe/Madrid' },
      },
    });
    return event.data.id || null;
  } catch (err) {
    console.error('[googleCalendar] Error creating event:', err);
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const gcal = getClient();
  if (!gcal) return;
  try {
    await gcal.calendar.events.delete({ calendarId: gcal.calendarId, eventId });
  } catch (err) {
    console.error('[googleCalendar] Error deleting event:', err);
  }
}
