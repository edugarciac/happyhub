import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAdminHandler, parseIntParam, buildDynamicUpdate, methodNotAllowed } from '@/lib/apiMiddleware';

export default withAdminHandler(async (req, res) => {
  const id = parseIntParam(req.query.id);
  if (!id) return res.status(400).json({ success: false, error: 'ID inválido' });

  if (req.method === 'GET') return handleGet(id, res);
  if (req.method === 'PATCH') return handleUpdate(id, req, res);
  if (req.method === 'DELETE') return handleDelete(id, res);
  return methodNotAllowed(res);
}, 'client');

async function handleGet(id: number, res: NextApiResponse) {
  const result = await query(
    'SELECT id, name, email, phone, role, email_verified, created_at FROM users WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
  }
  const reservations = await query(
    'SELECT id, event_date, time_slot, status, total_price, created_at FROM reservations WHERE user_id = $1 ORDER BY event_date DESC',
    [id]
  );
  return res.status(200).json({ success: true, client: result.rows[0], reservations: reservations.rows });
}

async function handleUpdate(id: number, req: NextApiRequest, res: NextApiResponse) {
  const { name, phone, role } = req.body;

  const existing = await query('SELECT id FROM users WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
  }

  const upd = buildDynamicUpdate({
    name: name !== undefined ? name.trim() : undefined,
    phone: phone !== undefined ? phone.trim() : undefined,
    role: role !== undefined && ['admin', 'client'].includes(role) ? role : undefined,
  });

  if (!upd) return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });

  upd.params.push(id);
  const result = await query(
    `UPDATE users SET ${upd.setClauses} WHERE id = $${upd.nextIndex}
     RETURNING id, name, email, phone, role, email_verified, created_at`,
    upd.params as any[]
  );

  return res.status(200).json({ success: true, client: result.rows[0] });
}

async function handleDelete(id: number, res: NextApiResponse) {
  const reservations = await query('SELECT COUNT(*) as count FROM reservations WHERE user_id = $1', [id]);
  if (parseInt(reservations.rows[0].count) > 0) {
    return res.status(409).json({
      success: false,
      error: 'No se puede eliminar: el cliente tiene reservas asociadas',
    });
  }

  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
  }

  return res.status(200).json({ success: true });
}
