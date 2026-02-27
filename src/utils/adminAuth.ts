import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface DecodedToken {
  userId: number;
  email: string;
  role: string;
}

export function verifyAdminToken(req: NextApiRequest): DecodedToken | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    if (decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

export function requireAdmin(req: NextApiRequest): DecodedToken {
  const decoded = verifyAdminToken(req);
  if (!decoded) {
    throw new Error('Unauthorized');
  }
  return decoded;
}
