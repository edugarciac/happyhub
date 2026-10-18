import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudit } from '@/lib/audit';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';
import { ensureContractAcceptancesTable } from '@/lib/contractAcceptance';
import { ensureReservationFlowColumns, expireUnpaidReservations } from '@/lib/reservationFlow';
import { sendReservationRequestNotifications } from '@/lib/reservationNotifications';
import { parseReservationExtras, resolveReservationExtras } from '@/lib/reservationExtras';
import { isValidExtraHours } from '@/utils/pricing';

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    await ensureReservationFlowColumns();
    await ensureContractAcceptancesTable();
    await expireUnpaidReservations();

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
              r.payment_method, r.payment_due_at, r.extra_hours, r.extras,
              r.last_payment_error, r.last_payment_error_at,
              r.remaining_payment_method, r.security_deposit_status, r.security_deposit_method,
              r.security_deposit_amount_held, r.security_deposit_expires_at, r.security_deposit_captured,
              COALESCE(u.name, ca.customer_name) AS name,
              COALESCE(u.email, ca.customer_email) AS email,
              COALESCE(u.phone, ca.customer_phone) AS phone
       FROM reservations r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN LATERAL (
         SELECT customer_name, customer_email, customer_phone FROM contract_acceptances
         WHERE reservation_id = r.id ORDER BY id DESC LIMIT 1
       ) ca ON true
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
      extraHours: Number(r.extra_hours) || 0,
      extras: parseReservationExtras(r.extras),
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
      paymentMethod: r.payment_method || null,
      paymentDueAt: r.payment_due_at || null,
      lastPaymentError: r.last_payment_error || null,
      lastPaymentErrorAt: r.last_payment_error_at || null,
      remainingPaymentMethod: r.remaining_payment_method || null,
      securityDepositStatus: r.security_deposit_status || 'none',
      securityDepositMethod: r.security_deposit_method || null,
      securityDepositAmountHeld: r.security_deposit_amount_held ? parseFloat(r.security_deposit_amount_held) : null,
      securityDepositExpiresAt: r.security_deposit_expires_at || null,
      securityDepositCaptured: r.security_deposit_captured ? parseFloat(r.security_deposit_captured) : null,
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
  const { name, email, phone, eventDate, timeSlot, eventType, guests, totalPrice, depositAmount, securityDeposit, notes, notifyClient, extraIds } = req.body;
  const extraHours = req.body.extraHours ?? 0;

  if (!eventDate || !timeSlot || !eventType) {
    return res.status(400).json({ success: false, error: 'Faltan campos obligatorios (fecha, franja, tipo)' });
  }
  if (!isValidExtraHours(timeSlot, extraHours)) {
    return res.status(400).json({ success: false, error: 'Horas adicionales no válidas (0–3, solo en la franja de tarde)' });
  }

  try {
    await ensureReservationFlowColumns();
    const extras = await resolveReservationExtras(extraIds);
    if (!extras) {
      return res.status(400).json({ success: false, error: 'Alguno de los servicios seleccionados no existe o no está activo' });
    }

    // Find or create user by email
    let userId: number | null = null;
    if (email?.trim()) {
      const userResult = await query('SELECT id FROM users WHERE LOWER(email) = $1', [email.trim().toLowerCase()]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      } else {
        // Create basic user. password_hash es NOT NULL: contraseña aleatoria que nadie conoce;
        // el cliente la fija con "¿Has olvidado tu contraseña?" (igual que el alta con Google)
        const unusablePasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        const newUser = await query(
          'INSERT INTO users (name, email, phone, role, password_hash, email_verified, created_at) VALUES ($1, $2, $3, $4, $5, true, NOW()) RETURNING id',
          [name?.trim() || '', email.trim().toLowerCase(), phone?.trim() || '', 'client', unusablePasswordHash]
        );
        userId = newUser.rows[0].id;
      }
    }

    const result = await query(
      `INSERT INTO reservations (user_id, event_date, time_slot, event_type, guests, total_price, deposit_amount, status, notes, extra_hours, extras, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10::jsonb, NOW(), NOW())
       RETURNING id`,
      [userId, eventDate, timeSlot, eventType, parseInt(guests as string) || 0, parseFloat(totalPrice) || 0, parseFloat(depositAmount) || 0, notes?.trim() || '', extraHours, JSON.stringify(extras)]
    );

    const reservationId: number = result.rows[0].id;

    // Mismo aviso al cliente que la reserva web (correo de solicitud + evento en Calendar).
    // Se espera porque Vercel congela la función al responder; si falla, la reserva se mantiene.
    // notifyClient === false: el admin ha elegido no enviar correo (solo se crea el evento de Calendar)
    const sendClientEmail = notifyClient !== false;
    const notified = await sendReservationRequestNotifications(reservationId, { sendEmail: sendClientEmail });
    const emailWarning = !sendClientEmail
      ? undefined
      : notified.noEmail
      ? 'Reserva creada sin email de cliente: no se ha enviado ningún correo'
      : notified.emailSent
        ? undefined
        : 'Reserva creada, pero no se pudo enviar el correo al cliente. Reenvíalo desde el listado.';

    return res.status(201).json({ success: true, id: reservationId, emailSent: notified.emailSent, ...(emailWarning ? { emailWarning } : {}) });
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    // Solo lo ve el admin: el motivo real ayuda a resolverlo sin mirar los logs
    return res.status(500).json({ success: false, error: `Error al crear la reserva: ${error?.message || error}` });
  }
}

export default withAudit('reservation.admin', handler, { methods: ['POST'] });
