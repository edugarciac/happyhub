import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserSpotifyConnection, getValidAccessToken } from '@/lib/spotify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });
  const userId = parseInt((session.user as any).id as string, 10);
  if (isNaN(userId)) return res.status(401).json({ error: 'No autenticado' });

  const connection = await getUserSpotifyConnection(userId);
  if (!connection) return res.status(403).json({ error: 'spotify_not_connected' });

  try {
    const token = await getValidAccessToken(connection.id);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;
    const url = cursor || 'https://api.spotify.com/v1/me/playlists?limit=50';

    const spotifyRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!spotifyRes.ok) return res.status(502).json({ error: 'Error obteniendo playlists de Spotify' });
    const data = await spotifyRes.json();

    return res.status(200).json({
      playlists: (data.items || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.images?.[0]?.url || null,
        trackCount: p.tracks?.total ?? 0,
      })),
      next: data.next || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
