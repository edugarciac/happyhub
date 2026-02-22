import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory storage for blocked dates (in production, use database)
// Format: { 'YYYY-MM-DD': { morning?: boolean, afternoon?: boolean, night?: boolean } }
let blockedDates: Record<string, { morning?: boolean; afternoon?: boolean; night?: boolean }> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Return all blocked dates
    return res.status(200).json({ blockedDates });
  }

  if (req.method === 'POST') {
    // Block a date/slot
    const { date, timeSlot, block = true } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    if (!blockedDates[date]) {
      blockedDates[date] = {};
    }

    if (timeSlot) {
      // Block specific slot
      if (block) {
        blockedDates[date][timeSlot as 'morning' | 'afternoon' | 'night'] = true;
      } else {
        delete blockedDates[date][timeSlot as 'morning' | 'afternoon' | 'night'];
      }
    } else {
      // Block entire day
      if (block) {
        blockedDates[date] = { morning: true, afternoon: true, night: true };
      } else {
        delete blockedDates[date];
      }
    }

    // Clean up empty entries
    if (blockedDates[date] && Object.keys(blockedDates[date]).length === 0) {
      delete blockedDates[date];
    }

    return res.status(200).json({
      success: true,
      date,
      timeSlot: timeSlot || 'all',
      blocked: block,
      blockedDates,
    });
  }

  if (req.method === 'DELETE') {
    // Unblock a date/slot
    const { date, timeSlot } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    if (timeSlot && blockedDates[date]) {
      delete blockedDates[date][timeSlot as 'morning' | 'afternoon' | 'night'];
      if (Object.keys(blockedDates[date]).length === 0) {
        delete blockedDates[date];
      }
    } else {
      delete blockedDates[date];
    }

    return res.status(200).json({
      success: true,
      date,
      timeSlot: timeSlot || 'all',
      unblocked: true,
      blockedDates,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
