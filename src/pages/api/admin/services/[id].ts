import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAdminHandler, parseIntParam, buildDynamicUpdate, methodNotAllowed } from '@/lib/apiMiddleware';
import { deleteFromS3 } from '@/lib/s3';

export default withAdminHandler(async (req, res) => {
  const id = parseIntParam(req.query.id);
  if (!id) return res.status(400).json({ success: false, error: 'ID inválido' });

  if (req.method === 'PATCH') return handleUpdate(id, req, res);
  if (req.method === 'DELETE') return handleDelete(id, res);
  return methodNotAllowed(res);
}, 'service');

async function handleUpdate(id: number, req: NextApiRequest, res: NextApiResponse) {
  const { title, price, description, features, image_url, active, sort_order } = req.body;

  let parsedPrice: number | null | undefined = undefined;
  if (price !== undefined) {
    parsedPrice = price !== '' && price !== null ? parseFloat(price) : null;
    if (parsedPrice !== null && !Number.isFinite(parsedPrice)) {
      return res.status(400).json({ success: false, error: 'El precio no es válido' });
    }
  }

  const upd = buildDynamicUpdate({
    title: title !== undefined ? title.trim() : undefined,
    price: parsedPrice,
    description: description !== undefined ? description.trim() : undefined,
    features: features !== undefined ? JSON.stringify(features) : undefined,
    image_url: image_url !== undefined ? (image_url || null) : undefined,
    active: active,
    sort_order: sort_order,
  });
  if (!upd) return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });

  const setWithTimestamp = `${upd.setClauses}, updated_at = CURRENT_TIMESTAMP`;
  upd.params.push(id);

  const result = await query(
    `UPDATE service_catalog SET ${setWithTimestamp} WHERE id = $${upd.nextIndex} RETURNING *`,
    upd.params as any[]
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
  return res.status(200).json({ success: true, service: result.rows[0] });
}

async function handleDelete(id: number, res: NextApiResponse) {
  // Get image URL to delete from S3
  const existing = await query('SELECT image_url FROM service_catalog WHERE id = $1', [id]);
  if (existing.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });

  if (existing.rows[0].image_url) {
    try { await deleteFromS3(existing.rows[0].image_url); } catch (err) { console.warn('Non-fatal: S3 image delete failed:', err); }
  }

  await query('DELETE FROM service_catalog WHERE id = $1', [id]);
  return res.status(200).json({ success: true });
}
