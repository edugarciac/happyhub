import type { NextApiRequest, NextApiResponse } from 'next';
import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

const handler = NextAuth(authOptions);

export default async function wrappedHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    return await handler(req, res);
  } catch (error: any) {
    console.error('NextAuth error:', error);
    return res.status(500).json({
      nextAuthError: true,
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 8),
    });
  }
}
