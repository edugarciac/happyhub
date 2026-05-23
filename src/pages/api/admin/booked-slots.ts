import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const [reservationsResult, blockedResult] = await Promise.all([
      query<{ event_date: string; time_slot: string }>(
        `SELECT TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date, time_slot
         FROM reservations
         WHERE status IN ('pending', 'approved', 'confirmed')
           AND event_date >= CURRENT_DATE`
      ),
      query<{ event_date: string; time_slot: string; reason: string | null }>(
        `SELECT TO_CHAR(slot_date, 'YYYY-MM-DD') AS event_date, time_slot, reason
         FROM blocked_slots
         WHERE slot_date >= CURRENT_DATE`
      ),
    ]);

    const reservationSlots = reservationsResult.rows.map((row) => ({
      date: `${row.event_date}T12:00:00.000Z`,
      timeSlot: row.time_slot,
      type: 'reservation' as const,
    }));

    const blockedSlots = blockedResult.rows.map((row) => ({
      date: `${row.event_date}T12:00:00.000Z`,
      timeSlot: row.time_slot,
      type: 'blocked' as const,
      reason: row.reason ?? undefined,
    }));

    return res.status(200).json({ slots: [...reservationSlots, ...blockedSlots] });
  } catch (error: any) {
    console.error('Error fetching admin booked slots:', error.message);
    return res.status(500).json({ error: 'Failed to fetch slots' });
  }
}
