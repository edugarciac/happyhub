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
    console.error('Error in pricing API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function handleList(req: NextApiRequest, res: NextApiResponse) {
  const result = await query(
    `SELECT * FROM pricing_rules ORDER BY day_type ASC, time_slot ASC, effective_from ASC NULLS FIRST`
  );
  return res.status(200).json({ success: true, rules: result.rows });
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  const { rule_name, day_type, time_slot, price, description, effective_from, effective_to } = req.body;

  if (!rule_name?.trim()) return res.status(400).json({ success: false, error: 'El nombre de la regla es obligatorio' });
  if (!day_type?.trim()) return res.status(400).json({ success: false, error: 'El tipo de día es obligatorio' });
  if (!time_slot?.trim()) return res.status(400).json({ success: false, error: 'La franja horaria es obligatoria' });
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) return res.status(400).json({ success: false, error: 'El precio debe ser un número mayor o igual a 0' });

  try {
    const result = await query(
      `INSERT INTO pricing_rules (rule_name, day_type, time_slot, price, description, effective_from, effective_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        rule_name.trim(),
        day_type.trim(),
        time_slot.trim(),
        parsedPrice,
        description?.trim() || '',
        effective_from || null,
        effective_to || null,
      ]
    );
    return res.status(201).json({ success: true, rule: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Ya existe una regla con ese nombre o esa combinación de tipo de día / franja / fecha de inicio' });
    }
    throw error;
  }
}
