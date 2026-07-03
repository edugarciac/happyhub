import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAdminHandler, methodNotAllowed } from '@/lib/apiMiddleware';

export default withAdminHandler(async (req, res) => {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  return methodNotAllowed(res);
}, 'services');

async function handleList(req: NextApiRequest, res: NextApiResponse) {
  const showAll = req.query.all === 'true';
  const where = showAll ? '' : 'WHERE active = true';
  const result = await query(`SELECT * FROM service_catalog ${where} ORDER BY sort_order ASC, title ASC`);
  return res.status(200).json({ success: true, services: result.rows });
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  const { title, price, description, features, image_url, sort_order } = req.body;
  if (!title?.trim()) return res.status(400).json({ success: false, error: 'El título es obligatorio' });

  const result = await query(
    `INSERT INTO service_catalog (title, price, description, features, image_url, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      title.trim(),
      price !== undefined && price !== '' ? parseFloat(price) : null,
      description?.trim() || '',
      JSON.stringify(features || []),
      image_url || null,
      sort_order || 0,
    ]
  );
  return res.status(201).json({ success: true, service: result.rows[0] });
}
