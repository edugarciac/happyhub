import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface DecodedToken {
  userId: number;
  email: string;
  role: string;
}

/**
 * Verify admin access. Checks next-auth session first, then falls back to JWT Bearer token.
 */
export function verifyAdminToken(req: NextApiRequest): DecodedToken | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    if (decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify admin via next-auth session (async). Use this for API routes.
 */
export async function verifyAdminSession(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<DecodedToken | null> {
  // Try next-auth session first
  const session = await getServerSession(req, res, authOptions);
  if (session?.user && (session.user as any).role === 'admin') {
    return {
      userId: parseInt((session.user as any).id) || 0,
      email: session.user.email || '',
      role: 'admin',
    };
  }

  // Fall back to JWT Bearer token
  return verifyAdminToken(req);
}

export function requireAdmin(req: NextApiRequest): DecodedToken {
  const decoded = verifyAdminToken(req);
  if (!decoded) {
    throw new Error('Unauthorized');
  }
  return decoded;
}

export async function requireAdminSession(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<DecodedToken> {
  const decoded = await verifyAdminSession(req, res);
  if (!decoded) {
    throw new Error('Unauthorized');
  }
  return decoded;
}
