import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../../../lib/db';
import { requireAdmin } from '../../../../utils/adminAuth';

// Available actions for HappyHub inline policies
export const AVAILABLE_ACTIONS = [
  'reservations:read',
  'reservations:write',
  'reservations:delete',
  'calendar:manage',
  'reviews:moderate',
  'users:read',
  'users:manage',
  'providers:read',
  'providers:manage',
  'services:read',
  'services:manage',
  'reports:view',
  'payments:view',
  'payments:refund',
] as const;

interface PolicyDocument {
  Version: string;
  Statement: Array<{
    Effect: 'Allow' | 'Deny';
    Action: string[];
    Resource: string;
  }>;
}

interface PoliciesResponse {
  success: boolean;
  policy?: any;
  policies?: any[];
  error?: string;
}

function validatePolicyDocument(doc: any): doc is PolicyDocument {
  if (!doc || typeof doc !== 'object') return false;
  if (typeof doc.Version !== 'string') return false;
  if (!Array.isArray(doc.Statement)) return false;

  for (const stmt of doc.Statement) {
    if (!['Allow', 'Deny'].includes(stmt.Effect)) return false;
    if (!Array.isArray(stmt.Action) || stmt.Action.length === 0) return false;
    for (const action of stmt.Action) {
      if (typeof action !== 'string') return false;
    }
    if (typeof stmt.Resource !== 'string') return false;
  }

  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PoliciesResponse>
) {
  try {
    const admin = requireAdmin(req);

    if (req.method === 'GET') {
      return handleGet(req, res);
    }
    if (req.method === 'POST') {
      return handleCreate(req, res, admin.userId);
    }
    if (req.method === 'PUT') {
      return handleUpdate(req, res);
    }
    if (req.method === 'DELETE') {
      return handleDelete(req, res);
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    console.error('Error in IAM policies handler:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse<PoliciesResponse>) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId requerido' });
  }

  const result = await query(
    `SELECT p.id, p.policy_name, p.policy_document, p.created_at, p.updated_at,
            u.name AS created_by_name
     FROM user_policies p
     LEFT JOIN users u ON u.id = p.created_by
     WHERE p.user_id = $1
     ORDER BY p.created_at ASC`,
    [parseInt(userId as string)]
  );

  return res.status(200).json({ success: true, policies: result.rows });
}

async function handleCreate(
  req: NextApiRequest,
  res: NextApiResponse<PoliciesResponse>,
  adminId: number
) {
  const { userId, policy_name, policy_document } = req.body;

  if (!userId || !policy_name || !policy_document) {
    return res.status(400).json({ success: false, error: 'userId, policy_name y policy_document son requeridos' });
  }

  if (!validatePolicyDocument(policy_document)) {
    return res.status(400).json({
      success: false,
      error: 'policy_document inválido. Debe tener Version (string) y Statement (array con Effect, Action, Resource)',
    });
  }

  // Verify target user exists
  const user = await queryOne('SELECT id FROM users WHERE id = $1', [parseInt(userId)]);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }

  const result = await queryOne(
    `INSERT INTO user_policies (user_id, policy_name, policy_document, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, policy_name, policy_document, created_at`,
    [parseInt(userId), policy_name.trim(), policy_document, adminId]
  );

  return res.status(201).json({ success: true, policy: result });
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse<PoliciesResponse>) {
  const { id, policy_name, policy_document } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, error: 'id de política requerido' });
  }

  if (!validatePolicyDocument(policy_document)) {
    return res.status(400).json({
      success: false,
      error: 'policy_document inválido. Debe tener Version (string) y Statement (array con Effect, Action, Resource)',
    });
  }

  const result = await queryOne(
    `UPDATE user_policies
     SET policy_name = $2, policy_document = $3, updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, policy_name, policy_document, updated_at`,
    [parseInt(id), policy_name.trim(), policy_document]
  );

  if (!result) {
    return res.status(404).json({ success: false, error: 'Política no encontrada' });
  }

  return res.status(200).json({ success: true, policy: result });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse<PoliciesResponse>) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'id de política requerido' });
  }

  const result = await query(
    'DELETE FROM user_policies WHERE id = $1 RETURNING id',
    [parseInt(id as string)]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ success: false, error: 'Política no encontrada' });
  }

  return res.status(200).json({ success: true });
}
