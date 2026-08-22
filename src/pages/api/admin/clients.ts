import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { withAdminHandler, methodNotAllowed } from '@/lib/apiMiddleware';

export default withAdminHandler(async (req, res) => {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  return methodNotAllowed(res);
}, 'clients');

async function handleList(req: NextApiRequest, res: NextApiResponse) {
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
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  const { name, email, phone, role, password } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ success: false, error: 'El email es obligatorio' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ success: false, error: 'Ya existe un usuario con ese email' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (name, email, phone, role, password_hash, email_verified, created_at)
     VALUES ($1, $2, $3, $4, $5, true, NOW())
     RETURNING id, name, email, phone, role, email_verified, created_at`,
    [name?.trim() || '', email.trim().toLowerCase(), phone?.trim() || '', role || 'client', hashedPassword]
  );

  return res.status(201).json({ success: true, client: result.rows[0] });
}
