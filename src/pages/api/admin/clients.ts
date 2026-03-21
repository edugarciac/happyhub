import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { requireAdminSession } from '../../../utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);

    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const countResult = await query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);

    params.push(limit, offset);
    const result = await query(
      `SELECT id, name, email, phone, role, email_verified, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );

    return res.status(200).json({
      success: true,
      clients: result.rows,
      total,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    console.error('Error fetching clients:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener clientes' });
  }
}
