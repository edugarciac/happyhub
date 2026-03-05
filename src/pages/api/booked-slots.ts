import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await query<{ event_date: string; time_slot: string }>(
      `SELECT TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date, time_slot
       FROM reservations
       WHERE status IN ('pending', 'approved')
         AND event_date >= CURRENT_DATE`
    );

    const bookedSlots = result.rows.map((row) => ({
      // Use noon UTC to avoid date shifting across timezones
      date: `${row.event_date}T12:00:00.000Z`,
      timeSlot: row.time_slot,
    }));

    return res.status(200).json({ bookedSlots });
  } catch (error: any) {
    console.error('Error fetching booked slots from DB:', error.message);
    return res.status(500).json({ error: 'Failed to fetch booked slots' });
  }
}
