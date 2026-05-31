// src/pages/api/entertainment/spotify/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Cache de client credentials token (válido 3600s, renovamos 60s antes)
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getClientCredentialsToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Spotify credentials not configured');

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Failed to get Spotify token');
  const data = await res.json();
  cachedToken = {
    value: data.access_token as string,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const q = req.query.q as string;
  if (!q?.trim()) return res.status(400).json({ error: 'Query requerida' });

  try {
    const token = await getClientCredentialsToken();
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=8&market=ES`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!searchRes.ok) return res.status(502).json({ error: 'Error buscando en Spotify' });

    const data = await searchRes.json();
    const tracks = (data.tracks?.items || []).map((t: any) => ({
      id: t.id,
      uri: t.uri,
      title: t.name,
      artist: t.artists.map((a: any) => a.name).join(', '),
      albumImage: t.album?.images?.[2]?.url || null,
    }));
    return res.status(200).json({ tracks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
