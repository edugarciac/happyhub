import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const admin = await requireAdminSession(req, res);

    if (req.method === 'GET') return handleList(req, res);
    if (req.method === 'POST') return handleCreate(req, res, admin.email);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error in holidays API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function handleList(req: NextApiRequest, res: NextApiResponse) {
  const result = await query(
    `SELECT id, TO_CHAR(holiday_date, 'YYYY-MM-DD') AS holiday_date, name, source, blocked, created_by, created_at
     FROM holidays ORDER BY holiday_date ASC`
  );
  return res.status(200).json({ success: true, holidays: result.rows });
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse, adminEmail: string) {
  const { holiday_date, name } = req.body;

  if (!holiday_date?.trim()) return res.status(400).json({ success: false, error: 'La fecha es obligatoria' });
  if (!name?.trim()) return res.status(400).json({ success: false, error: 'El nombre es obligatorio' });

  try {
    const result = await query(
      `INSERT INTO holidays (holiday_date, name, source, created_by)
       VALUES ($1, $2, 'custom', $3)
       RETURNING id, TO_CHAR(holiday_date, 'YYYY-MM-DD') AS holiday_date, name, source, blocked, created_by, created_at`,
      [holiday_date.trim(), name.trim(), adminEmail]
    );
    return res.status(201).json({ success: true, holiday: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Ya existe un festivo con esa fecha' });
    }
    throw error;
  }
}
