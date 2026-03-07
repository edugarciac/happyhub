import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../lib/db';
import { requireAdmin } from '../../../../utils/adminAuth';

interface UsersResponse {
  success: boolean;
  users?: any[];
  total?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UsersResponse>
) {
  try {
    requireAdmin(req);

    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const search = (req.query.search as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    params.push(limit, offset);
    const result = await query(
      `SELECT
         u.id,
         u.email,
         u.name,
         u.role,
         u.created_at,
         COALESCE(
           json_agg(
             json_build_object(
               'id', p.id,
               'policy_name', p.policy_name,
               'policy_document', p.policy_document,
               'created_at', p.created_at
             ) ORDER BY p.created_at ASC
           ) FILTER (WHERE p.id IS NOT NULL),
           '[]'
         ) AS policies
       FROM users u
       LEFT JOIN user_policies p ON p.user_id = u.id
       ${whereClause}
       GROUP BY u.id, u.email, u.name, u.role, u.created_at
       ORDER BY u.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );

    return res.status(200).json({ success: true, users: result.rows, total });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    console.error('Error fetching IAM users:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
