import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });
  const userId = parseInt((session.user as any).id as string, 10);
  if (isNaN(userId)) return res.status(401).json({ error: 'No autenticado' });

  const connResult = await query(
    `SELECT id FROM user_spotify_connections WHERE user_id = $1`,
    [userId]
  );
  if (connResult.rows.length === 0) {
    return res.status(200).json({ disconnected: true, affectedEvents: 0 });
  }
  const connectionId = connResult.rows[0].id;

  const affected = await query(
    `UPDATE event_spotify_connections SET user_connection_id = NULL WHERE user_connection_id = $1 RETURNING event_id`,
    [connectionId]
  );

  await query(`DELETE FROM user_spotify_connections WHERE id = $1`, [connectionId]);

  return res.status(200).json({ disconnected: true, affectedEvents: affected.rows.length });
}
