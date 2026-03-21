import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '../../../../lib/db';
import { verifyAdminSession } from '../../../../utils/adminAuth';

type ReviewStatus = 'pending_review' | 'published' | 'archived' | 'cancelled';

const ALLOWED_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
  pending_review: ['published', 'cancelled'],
  published: ['archived', 'cancelled'],
  archived: ['published'],
  cancelled: ['pending_review'],
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, error: 'ID de reseña inválido' });
  }

  const { status } = req.body as { status: ReviewStatus };
  if (!status) {
    return res.status(400).json({ success: false, error: 'Se requiere el campo status' });
  }

  try {
    const review = await queryOne<{ id: number; status: ReviewStatus }>(
      'SELECT id, status FROM reviews WHERE id = $1',
      [parseInt(id)]
    );

    if (!review) {
      return res.status(404).json({ success: false, error: 'Reseña no encontrada' });
    }

    const allowed = ALLOWED_TRANSITIONS[review.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Transición de estado no permitida' });
    }

    const updated = await queryOne(
      `UPDATE reviews SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
       RETURNING id, rating, review_text, customer_name, title, status, created_at, updated_at`,
      [status, parseInt(id)]
    );

    return res.status(200).json({ success: true, review: updated });
  } catch (error) {
    console.error('Error updating review status:', error);
    return res.status(500).json({ success: false, error: 'Error al cambiar estado' });
  }
}
