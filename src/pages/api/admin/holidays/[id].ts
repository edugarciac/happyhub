import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

type TimeSlot = 'morning' | 'afternoon' | 'night';
const ALL_SLOTS: TimeSlot[] = ['morning', 'afternoon', 'night'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const admin = await requireAdminSession(req, res);
    const id = parseInt(req.query.id as string);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido' });

    if (req.method === 'PATCH') return handleUpdate(id, req, res, admin.email);
    if (req.method === 'DELETE') return handleDelete(id, res);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error in holiday API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function handleUpdate(id: number, req: NextApiRequest, res: NextApiResponse, adminEmail: string) {
  const { holiday_date, name, blocked } = req.body as {
    holiday_date?: string;
    name?: string;
    blocked?: boolean;
  };

  const holiday = await queryOne<{ id: number; holiday_date: string; name: string; blocked: boolean }>(
    `SELECT id, TO_CHAR(holiday_date, 'YYYY-MM-DD') AS holiday_date, name, blocked FROM holidays WHERE id = $1`,
    [id]
  );
  if (!holiday) return res.status(404).json({ success: false, error: 'No encontrado' });

  const fields: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (holiday_date !== undefined) { fields.push(`holiday_date = $${idx++}`); params.push(holiday_date); }
  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ success: false, error: 'El nombre es obligatorio' });
    fields.push(`name = $${idx++}`); params.push(name.trim());
  }
  if (blocked !== undefined) { fields.push(`blocked = $${idx++}`); params.push(blocked); }

  if (fields.length === 0) return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  try {
    const result = await query(
      `UPDATE holidays SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, TO_CHAR(holiday_date, 'YYYY-MM-DD') AS holiday_date, name, source, blocked, created_by, created_at`,
      params
    );
    const updated = result.rows[0];

    if (blocked !== undefined && blocked !== holiday.blocked) {
      const effectiveDate = holiday_date !== undefined ? holiday_date : holiday.holiday_date;
      if (blocked) {
        await blockHolidaySlots(id, effectiveDate, name?.trim() || holiday.name, adminEmail);
      } else {
        await unblockHolidaySlots(id);
      }
    }

    return res.status(200).json({ success: true, holiday: updated });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Ya existe un festivo con esa fecha' });
    }
    throw error;
  }
}

async function handleDelete(id: number, res: NextApiResponse) {
  // blocked_slots rows are cleaned up automatically via ON DELETE CASCADE on holiday_id
  const result = await query('DELETE FROM holidays WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
  return res.status(200).json({ success: true });
}

async function blockHolidaySlots(holidayId: number, date: string, name: string, adminEmail: string) {
  for (const timeSlot of ALL_SLOTS) {
    await query(
      `INSERT INTO blocked_slots (slot_date, time_slot, reason, created_by, holiday_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slot_date, time_slot) DO UPDATE
         SET reason = EXCLUDED.reason,
             holiday_id = EXCLUDED.holiday_id,
             updated_at = CURRENT_TIMESTAMP`,
      [date, timeSlot, `Festivo: ${name}`, adminEmail, holidayId]
    );
  }
}

async function unblockHolidaySlots(holidayId: number) {
  await query(`DELETE FROM blocked_slots WHERE holiday_id = $1`, [holidayId]);
}
