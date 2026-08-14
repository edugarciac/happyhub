import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    return handleList(req, res);
  } else if (req.method === 'POST') {
    return handleCreate(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleList(req: NextApiRequest, res: NextApiResponse) {
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
        `(u.name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR u.phone ILIKE $${paramIdx} OR CAST(r.id AS TEXT) ILIKE $${paramIdx})`
      );
      params.push(searchPattern);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM reservations r LEFT JOIN users u ON r.user_id = u.id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const result = await query(
      `SELECT r.id, r.event_type, r.event_date, r.time_slot,
              r.guests, r.total_price, r.deposit_amount, r.deposit_paid,
              r.payment_status,
              r.status, r.notes, r.created_at, r.updated_at,
              r.rejection_reason, r.cancellation_reason,
              r.admin_approved_by, r.approved_at, r.needs_kids_furniture,
              u.name, u.email, u.phone
       FROM reservations r
       LEFT JOIN users u ON r.user_id = u.id
       ${whereClause}
       ORDER BY r.event_date DESC, r.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limitNum, offsetNum]
    );

    const reservations = result.rows.map((r: any) => ({
      id: r.id,
      name: r.name || '',
      email: r.email || '',
      phone: r.phone || '',
      eventType: r.event_type || '',
      eventDate: r.event_date,
      timeSlot: r.time_slot,
      guests: r.guests || 0,
      totalPrice: parseFloat(r.total_price || '0'),
      depositAmount: parseFloat(r.deposit_amount || '0'),
      depositPaid: parseFloat(r.deposit_paid || '0'),
      paymentStatus: r.payment_status || 'pending',
      status: r.status || 'pending',
      notes: r.notes || '',
      rejectionReason: r.rejection_reason || '',
      cancellationReason: r.cancellation_reason || '',
      needsKidsFurniture: !!r.needs_kids_furniture,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return res.status(200).json({ total, limit: limitNum, offset: offsetNum, reservations });
  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    return res.status(500).json({ error: 'Error al obtener reservas' });
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  const { name, email, phone, eventDate, timeSlot, eventType, guests, totalPrice, depositAmount, securityDeposit, notes } = req.body;

  if (!eventDate || !timeSlot || !eventType) {
    return res.status(400).json({ success: false, error: 'Faltan campos obligatorios (fecha, franja, tipo)' });
  }

  try {
    // Find or create user by email
    let userId: number | null = null;
    if (email?.trim()) {
      const userResult = await query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      } else {
        // Create basic user
        const newUser = await query(
          'INSERT INTO users (name, email, phone, role, email_verified, created_at) VALUES ($1, $2, $3, $4, true, NOW()) RETURNING id',
          [name?.trim() || '', email.trim().toLowerCase(), phone?.trim() || '', 'client']
        );
        userId = newUser.rows[0].id;
      }
    }

    const result = await query(
      `INSERT INTO reservations (user_id, event_date, time_slot, event_type, guests, total_price, deposit_amount, status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW(), NOW())
       RETURNING id`,
      [userId, eventDate, timeSlot, eventType, parseInt(guests as string) || 0, parseFloat(totalPrice) || 0, parseFloat(depositAmount) || 0, notes?.trim() || '']
    );

    return res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    return res.status(500).json({ success: false, error: 'Error al crear la reserva' });
  }
}
