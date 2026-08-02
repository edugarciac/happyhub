import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAdminHandler, methodNotAllowed } from '@/lib/apiMiddleware';

export default withAdminHandler(async (req, res) => {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  return methodNotAllowed(res);
}, 'event-types');

async function handleList(req: NextApiRequest, res: NextApiResponse) {
  const result = await query('SELECT * FROM event_types ORDER BY sort_order ASC, name ASC');
  return res.status(200).json({ success: true, eventTypes: result.rows });
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, icon, image_url, features } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, error: 'El nombre es obligatorio' });

  const existing = await query('SELECT id FROM event_types WHERE name = $1', [name.trim()]);
  if (existing.rows.length > 0) return res.status(409).json({ success: false, error: 'Ya existe un tipo con ese nombre' });

  const result = await query(
    'INSERT INTO event_types (name, description, icon, image_url, features) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name.trim(), description?.trim() || '', icon?.trim() || '', image_url || null, JSON.stringify(features || [])]
  );
  return res.status(201).json({ success: true, eventType: result.rows[0] });
}
