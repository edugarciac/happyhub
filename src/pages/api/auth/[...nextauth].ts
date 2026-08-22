import type { NextApiRequest, NextApiResponse } from 'next';
import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

// Force NEXTAUTH_URL at runtime - Amplify Lambda may not pass .env.production to SSR functions
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'https://www.happyhub.es';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    return await NextAuth(req, res, authOptions);
  } catch (error: unknown) {
    console.error('NextAuth error:', error);
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : 'Error';
    const isDev = process.env.NODE_ENV === 'development';
    return res.status(500).json({
      nextAuthError: true,
      message: isDev ? message : 'Error de autenticación',
      name,
      ...(isDev ? {
        envDebug: {
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
          NODE_ENV: process.env.NODE_ENV,
        },
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 8) : undefined,
      } : {}),
    });
  }
}
