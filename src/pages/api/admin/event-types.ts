import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);

    if (req.method === 'GET') return handleList(req, res);
    if (req.method === 'POST') return handleCreate(req, res);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error in event-types API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function handleList(req: NextApiRequest, res: NextApiResponse) {
  const result = await query('SELECT * FROM event_types ORDER BY sort_order ASC, name ASC');
  return res.status(200).json({ success: true, eventTypes: result.rows });
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, icon, image_url } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, error: 'El nombre es obligatorio' });

  const existing = await query('SELECT id FROM event_types WHERE name = $1', [name.trim()]);
  if (existing.rows.length > 0) return res.status(409).json({ success: false, error: 'Ya existe un tipo con ese nombre' });

  const result = await query(
    'INSERT INTO event_types (name, description, icon, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
    [name.trim(), description?.trim() || '', icon?.trim() || '', image_url || null]
  );
  return res.status(201).json({ success: true, eventType: result.rows[0] });
}
