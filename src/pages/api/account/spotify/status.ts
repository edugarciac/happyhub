import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserSpotifyConnection } from '@/lib/spotify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });
  const userId = parseInt((session.user as any).id as string, 10);
  if (isNaN(userId)) return res.status(401).json({ error: 'No autenticado' });

  const connection = await getUserSpotifyConnection(userId);
  if (!connection) return res.status(200).json({ connected: false });

  return res.status(200).json({
    connected: true,
    displayName: connection.display_name,
    product: connection.product,
  });
}
