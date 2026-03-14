import type { NextApiRequest, NextApiResponse } from 'next';
import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

// Ensure NEXTAUTH_URL is set at runtime (Amplify Lambda may not receive .env.production vars)
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'https://www.happyhub.es';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(req, res, authOptions);
}
