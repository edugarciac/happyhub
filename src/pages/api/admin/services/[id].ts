import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';
import { deleteFromS3 } from '@/lib/s3';

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
    console.error('Error in service API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function handleUpdate(id: number, req: NextApiRequest, res: NextApiResponse) {
  const { title, price, description, features, image_url, active, sort_order } = req.body;
  const fields: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (title !== undefined) { fields.push(`title = $${idx++}`); params.push(title.trim()); }
  if (price !== undefined) { fields.push(`price = $${idx++}`); params.push(price !== '' && price !== null ? parseFloat(price) : null); }
  if (description !== undefined) { fields.push(`description = $${idx++}`); params.push(description.trim()); }
  if (features !== undefined) { fields.push(`features = $${idx++}`); params.push(JSON.stringify(features)); }
  if (image_url !== undefined) { fields.push(`image_url = $${idx++}`); params.push(image_url || null); }
  if (active !== undefined) { fields.push(`active = $${idx++}`); params.push(active); }
  if (sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); params.push(sort_order); }

  if (fields.length === 0) return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  const result = await query(
    `UPDATE service_catalog SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
  return res.status(200).json({ success: true, service: result.rows[0] });
}

async function handleDelete(id: number, res: NextApiResponse) {
  // Get image URL to delete from S3
  const existing = await query('SELECT image_url FROM service_catalog WHERE id = $1', [id]);
  if (existing.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });

  if (existing.rows[0].image_url) {
    try { await deleteFromS3(existing.rows[0].image_url); } catch { /* ignore S3 errors */ }
  }

  await query('DELETE FROM service_catalog WHERE id = $1', [id]);
  return res.status(200).json({ success: true });
}
