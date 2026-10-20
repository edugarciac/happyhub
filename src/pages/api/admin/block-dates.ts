import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';

type TimeSlot = 'morning' | 'afternoon' | 'night';

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
  }>(
    `SELECT id, TO_CHAR(slot_date, 'YYYY-MM-DD') AS slot_date, time_slot, reason,
            created_by, created_at
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
      const row = await queryOne<{ id: number; slot_date: string; time_slot: string }>(
        `INSERT INTO blocked_slots (slot_date, time_slot, reason, created_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slot_date, time_slot) DO UPDATE
           SET reason = EXCLUDED.reason,
               updated_at = CURRENT_TIMESTAMP
         RETURNING id, TO_CHAR(slot_date, 'YYYY-MM-DD') AS slot_date, time_slot`,
        [date, timeSlot, reason || null, adminEmail]
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

  const result = await query(
    `DELETE FROM blocked_slots WHERE id = ANY($1)`,
    [ids]
  );

  return res.status(200).json({ deleted: result.rowCount ?? 0 });
}
