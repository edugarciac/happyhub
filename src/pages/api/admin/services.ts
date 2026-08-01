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
    console.error('Error in services API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function handleList(req: NextApiRequest, res: NextApiResponse) {
  const showAll = req.query.all === 'true';
  const where = showAll ? '' : 'WHERE active = true';
  const result = await query(`SELECT * FROM service_catalog ${where} ORDER BY sort_order ASC, title ASC`);
  return res.status(200).json({ success: true, services: result.rows });
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  const { title, price, description, features, image_url, sort_order } = req.body;
  if (!title?.trim()) return res.status(400).json({ success: false, error: 'El título es obligatorio' });

  const parsedPrice = price !== undefined && price !== '' ? parseFloat(price) : null;
  if (parsedPrice !== null && !Number.isFinite(parsedPrice)) {
    return res.status(400).json({ success: false, error: 'El precio no es válido' });
  }

  const result = await query(
    `INSERT INTO service_catalog (title, price, description, features, image_url, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      title.trim(),
      parsedPrice,
      description?.trim() || '',
      JSON.stringify(features || []),
      image_url || null,
      sort_order || 0,
    ]
  );
  return res.status(201).json({ success: true, service: result.rows[0] });
}
