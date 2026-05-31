import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);

    const id = parseInt(req.query.id as string);
    if (!id || isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

    if (req.method === 'PATCH') return handleUpdate(id, req, res);
    if (req.method === 'DELETE') return handleDelete(id, res);

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    console.error('Error in reservation-services/[id] API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

const VALID_STATUSES = ['requested', 'confirmed', 'cancelled', 'completed'];

async function handleUpdate(id: number, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { service_name, service_type, reservation_id, partner_id, price, status, notes } = req.body;

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado inválido' });
    }

    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (service_name !== undefined) {
      fields.push(`service_name = $${idx++}`);
      params.push(service_name.trim());
    }
    if (service_type !== undefined) {
      fields.push(`service_type = $${idx++}`);
      params.push(service_type ? service_type.trim() : null);
    }
    if (reservation_id !== undefined) {
      fields.push(`reservation_id = $${idx++}`);
      params.push(reservation_id ? parseInt(reservation_id) : null);
    }
    if (partner_id !== undefined) {
      fields.push(`partner_id = $${idx++}`);
      params.push(partner_id ? parseInt(partner_id) : null);
    }
    if (price !== undefined) {
      fields.push(`price = $${idx++}`);
      params.push(price !== '' && price !== null ? parseFloat(price) : null);
    }
    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      params.push(status);
    }
    if (notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      params.push(notes ? notes.trim() : null);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await query(
      `UPDATE services SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Servicio no encontrado' });
    }

    return res.status(200).json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Error updating reservation service:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar servicio' });
  }
}

async function handleDelete(id: number, res: NextApiResponse) {
  try {
    const existing = await query('SELECT id FROM services WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Servicio no encontrado' });
    }

    await query('DELETE FROM services WHERE id = $1', [id]);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation service:', error);
    return res.status(500).json({ success: false, error: 'Error al eliminar servicio' });
  }
}
