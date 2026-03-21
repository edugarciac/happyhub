import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const {
    status = 'all',
    dateFrom,
    dateTo,
    search,
    limit = '20',
    offset = '0',
  } = req.query;

  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (status && status !== 'all') {
      conditions.push(`r.status = $${paramIdx++}`);
      params.push(status);
    }

    if (dateFrom) {
      conditions.push(`r.event_date >= $${paramIdx++}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push(`r.event_date <= $${paramIdx++}`);
      params.push(dateTo);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      conditions.push(
        `(r.name ILIKE $${paramIdx} OR r.email ILIKE $${paramIdx} OR r.phone ILIKE $${paramIdx} OR CAST(r.id AS TEXT) ILIKE $${paramIdx})`
      );
      params.push(searchPattern);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM reservations r ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const result = await query(
      `SELECT r.id, r.name, r.email, r.phone, r.event_type, r.event_date, r.time_slot,
              r.guests, r.extras, r.base_price, r.total_price, r.deposit_amount,
              r.security_deposit, r.payment_method, r.status, r.customer_message,
              r.created_at, r.updated_at
       FROM reservations r
       ${whereClause}
       ORDER BY r.event_date DESC, r.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limitNum, offsetNum]
    );

    const reservations = result.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      eventType: r.event_type,
      eventDate: r.event_date,
      timeSlot: r.time_slot,
      guests: r.guests,
      extras: r.extras || [],
      basePrice: parseFloat(r.base_price),
      totalPrice: parseFloat(r.total_price || '0'),
      depositAmount: parseFloat(r.deposit_amount || '0'),
      securityDeposit: r.security_deposit ? parseFloat(r.security_deposit) : 200,
      paymentMethod: r.payment_method,
      status: r.status,
      message: r.customer_message || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return res.status(200).json({ total, limit: limitNum, offset: offsetNum, reservations });
  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    return res.status(500).json({ error: 'Error al obtener reservas' });
  }
}
