import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const admin = await requireAdminSession(req, res);
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    const id = parseInt(req.query.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

    const result = await query(
      `UPDATE activity_catalog_proposals
       SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2 AND status = 'pending'
       RETURNING id`,
      [admin.email || 'admin', id]
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ success: false, error: 'Propuesta no encontrada o ya revisada' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error rejecting proposal:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
