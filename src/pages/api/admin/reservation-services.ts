import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);

    if (req.method === 'GET') return handleGet(req, res);
    if (req.method === 'POST') return handleCreate(req, res);

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    console.error('Error in reservation-services API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const filterStatus = req.query.status as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (s.service_name ILIKE $${paramCount} OR s.service_type ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (filterStatus && filterStatus !== 'all') {
      paramCount++;
      whereClause += ` AND s.status = $${paramCount}`;
      params.push(filterStatus);
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM services s ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    params.push(limit, offset);
    const result = await query(
      `SELECT s.*, p.name as partner_name, r.event_date, r.status as reservation_status
       FROM services s
       LEFT JOIN partners p ON p.id = s.partner_id
       LEFT JOIN reservations r ON r.id = s.reservation_id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );

    return res.status(200).json({ success: true, services: result.rows, total, page, limit });
  } catch (error) {
    console.error('Error fetching reservation services:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener servicios' });
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { service_name, service_type, reservation_id, partner_id, price, status, notes } = req.body;

    if (!service_name || !service_name.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre del servicio es obligatorio' });
    }

    const result = await query(
      `INSERT INTO services (service_name, service_type, reservation_id, partner_id, price, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        service_name.trim(),
        service_type ? service_type.trim() : null,
        reservation_id ? parseInt(reservation_id) : null,
        partner_id ? parseInt(partner_id) : null,
        price !== undefined && price !== '' && price !== null ? parseFloat(price) : null,
        status || 'requested',
        notes ? notes.trim() : null,
      ]
    );

    return res.status(201).json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Error creating reservation service:', error);
    return res.status(500).json({ success: false, error: 'Error al crear servicio' });
  }
}
