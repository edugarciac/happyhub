import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAdminHandler, parseIntParam, buildDynamicUpdate, methodNotAllowed } from '@/lib/apiMiddleware';

export default withAdminHandler(async (req, res) => {
  const id = parseIntParam(req.query.id);
  if (!id) return res.status(400).json({ success: false, error: 'ID inválido' });

  if (req.method === 'PATCH') return handleUpdate(id, req, res);
  if (req.method === 'DELETE') return handleDelete(id, res);
  return methodNotAllowed(res);
}, 'event-type');

async function handleUpdate(id: number, req: NextApiRequest, res: NextApiResponse) {
  const { name, description, icon, image_url, active, sort_order, features } = req.body;

  const upd = buildDynamicUpdate({
    name: name !== undefined ? name.trim() : undefined,
    description: description !== undefined ? description.trim() : undefined,
    icon: icon !== undefined ? icon.trim() : undefined,
    image_url: image_url !== undefined ? (image_url || null) : undefined,
    active: active,
    sort_order: sort_order,
    features: features !== undefined ? JSON.stringify(features) : undefined,
  });

  if (!upd) return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });

  upd.params.push(id);
  const result = await query(
    `UPDATE event_types SET ${upd.setClauses} WHERE id = $${upd.nextIndex} RETURNING *`,
    upd.params as any[]
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
  return res.status(200).json({ success: true, eventType: result.rows[0] });
}

async function handleDelete(id: number, res: NextApiResponse) {
  const result = await query('DELETE FROM event_types WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
  return res.status(200).json({ success: true });
}
