import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../lib/db';
import { requireAdminSession } from '../../../../utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);

    const id = parseInt(req.query.id as string);
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    if (req.method === 'GET') {
      return handleGet(id, res);
    } else if (req.method === 'PATCH') {
      return handleUpdate(id, req, res);
    } else if (req.method === 'DELETE') {
      return handleDelete(id, res);
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    console.error('Error in client API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function handleGet(id: number, res: NextApiResponse) {
  const result = await query(
    'SELECT id, name, email, phone, role, email_verified, created_at FROM users WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
  }
  return res.status(200).json({ success: true, client: result.rows[0] });
}

async function handleUpdate(id: number, req: NextApiRequest, res: NextApiResponse) {
  const { name, phone, role } = req.body;

  // Check client exists
  const existing = await query('SELECT id FROM users WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
  }

  const fields: string[] = [];
  const params: any[] = [];
  let paramCount = 0;

  if (name !== undefined) {
    paramCount++;
    fields.push(`name = $${paramCount}`);
    params.push(name.trim());
  }
  if (phone !== undefined) {
    paramCount++;
    fields.push(`phone = $${paramCount}`);
    params.push(phone.trim());
  }
  if (role !== undefined && ['admin', 'client'].includes(role)) {
    paramCount++;
    fields.push(`role = $${paramCount}`);
    params.push(role);
  }

  if (fields.length === 0) {
    return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
  }

  paramCount++;
  params.push(id);
  const result = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}
     RETURNING id, name, email, phone, role, email_verified, created_at`,
    params
  );

  return res.status(200).json({ success: true, client: result.rows[0] });
}

async function handleDelete(id: number, res: NextApiResponse) {
  // Check if client has reservations
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
