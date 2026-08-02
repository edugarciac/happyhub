import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

interface BookedSlot {
  date: string; // ISO string format for JSON serialization
  timeSlot: 'morning' | 'afternoon' | 'night';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID } = process.env;

    // If Google Calendar credentials are not configured, return empty array (all available)
    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_CALENDAR_ID) {
      console.warn('Google Calendar credentials not configured. Returning all slots as available.');
      return res.status(200).json({ bookedSlots: [] });
    }

    // Initialize Google Calendar API with service account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Get events from now until 6 months in the future
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    const response = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: sixMonthsLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Parse events into BookedSlot format
    const bookedSlots: BookedSlot[] = events
      .filter((event) => event.start?.dateTime && event.end?.dateTime)
      .map((event) => {
        const startTime = new Date(event.start!.dateTime!);
        const startHour = startTime.getHours();

        // Determine time slot based on start time
        let timeSlot: 'morning' | 'afternoon' | 'night' = 'morning';

        // Morning: 10:00-14:00
        if (startHour >= 10 && startHour < 15) {
          timeSlot = 'morning';
        }
        // Afternoon: 16:30-20:30
        else if (startHour >= 15 && startHour < 21) {
          timeSlot = 'afternoon';
        }
        // Night: 22:00-02:00
        else if (startHour >= 21 || startHour < 3) {
          timeSlot = 'night';
        }

        // Use event start date (not time) for date
        const eventDate = new Date(startTime);
        eventDate.setHours(0, 0, 0, 0);

        return {
          date: eventDate.toISOString(),
          timeSlot,
        };
      });

    return res.status(200).json({ bookedSlots });
  } catch (error: any) {
    console.error('Error fetching booked slots from Google Calendar:', error.message);

    // If API fails, return empty array (better UX - show all as available)
    return res.status(200).json({ bookedSlots: [] });
  }
}
