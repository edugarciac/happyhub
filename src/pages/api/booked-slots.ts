import type { NextApiRequest, NextApiResponse } from 'next';
import { getBookedSlots } from '@/lib/bookedSlots';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const bookedSlots = (await getBookedSlots()).map((slot) => ({
      // Use noon UTC to avoid date shifting across timezones
      date: `${slot.date}T12:00:00.000Z`,
      timeSlot: slot.timeSlot,
    }));

    return res.status(200).json({ bookedSlots });
  } catch (error: any) {
    console.error('Error fetching booked slots from DB:', error.message);
    return res.status(500).json({ error: 'Failed to fetch booked slots' });
  }
}
