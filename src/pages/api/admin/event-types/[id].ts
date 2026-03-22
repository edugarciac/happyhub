import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);
    const id = parseInt(req.query.id as string);
    if (!id) return res.status(400).json({ success: false, error: 'ID inválido' });

    if (req.method === 'PATCH') return handleUpdate(id, req, res);
    if (req.method === 'DELETE') return handleDelete(id, res);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error in event-type API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function handleUpdate(id: number, req: NextApiRequest, res: NextApiResponse) {
  const { name, description, icon, image_url, active, sort_order } = req.body;
  const fields: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (name !== undefined) { fields.push(`name = $${idx++}`); params.push(name.trim()); }
  if (description !== undefined) { fields.push(`description = $${idx++}`); params.push(description.trim()); }
  if (icon !== undefined) { fields.push(`icon = $${idx++}`); params.push(icon.trim()); }
  if (image_url !== undefined) { fields.push(`image_url = $${idx++}`); params.push(image_url || null); }
  if (active !== undefined) { fields.push(`active = $${idx++}`); params.push(active); }
  if (sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); params.push(sort_order); }

  if (fields.length === 0) return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });

  params.push(id);
  const result = await query(
    `UPDATE event_types SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
  return res.status(200).json({ success: true, eventType: result.rows[0] });
}

async function handleDelete(id: number, res: NextApiResponse) {
  const result = await query('DELETE FROM event_types WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
  return res.status(200).json({ success: true });
}
