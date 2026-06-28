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
    console.error('Error in pricing rule API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function handleUpdate(id: number, req: NextApiRequest, res: NextApiResponse) {
  const { rule_name, day_type, time_slot, price, description, effective_from, effective_to, active } = req.body;
  const fields: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (rule_name !== undefined) { fields.push(`rule_name = $${idx++}`); params.push(rule_name.trim()); }
  if (day_type !== undefined) { fields.push(`day_type = $${idx++}`); params.push(day_type.trim()); }
  if (time_slot !== undefined) { fields.push(`time_slot = $${idx++}`); params.push(time_slot.trim()); }
  if (price !== undefined) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) return res.status(400).json({ success: false, error: 'El precio debe ser un número mayor o igual a 0' });
    fields.push(`price = $${idx++}`); params.push(parsedPrice);
  }
  if (description !== undefined) { fields.push(`description = $${idx++}`); params.push(description?.trim() || ''); }
  if (effective_from !== undefined) { fields.push(`effective_from = $${idx++}`); params.push(effective_from || null); }
  if (effective_to !== undefined) { fields.push(`effective_to = $${idx++}`); params.push(effective_to || null); }
  if (active !== undefined) { fields.push(`active = $${idx++}`); params.push(active); }

  if (fields.length === 0) return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  try {
    const result = await query(
      `UPDATE pricing_rules SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
    return res.status(200).json({ success: true, rule: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Ya existe una regla con ese nombre o esa combinación de tipo de día / franja / fecha de inicio' });
    }
    throw error;
  }
}

async function handleDelete(id: number, res: NextApiResponse) {
  const result = await query('DELETE FROM pricing_rules WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
  return res.status(200).json({ success: true });
}
