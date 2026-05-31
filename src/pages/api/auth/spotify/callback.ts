// src/pages/api/auth/spotify/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { code, state, error } = req.query;

  if (error) return res.redirect('/mis-eventos?error=spotify_denied');
  if (!code || !state) return res.redirect('/mis-eventos?error=spotify_invalid');

  const [eventIdStr, userIdStr] = (state as string).split(':');
  const eventId = parseInt(eventIdStr, 10);
  const userId = parseInt(userIdStr, 10);
  if (isNaN(eventId) || isNaN(userId)) return res.redirect('/mis-eventos?error=spotify_invalid');

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return res.redirect(`/mis-eventos/${eventId}?section=entretenimiento&error=spotify_config`);
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenRes.ok) {
      return res.redirect(`/mis-eventos/${eventId}?section=entretenimiento&error=spotify_token`);
    }

    const tokenData = await tokenRes.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await query(
      `INSERT INTO event_spotify_connections (event_id, user_id, access_token, refresh_token, token_expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (event_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         token_expires_at = EXCLUDED.token_expires_at,
         updated_at = NOW()`,
      [eventId, userId, tokenData.access_token, tokenData.refresh_token, expiresAt]
    );

    return res.redirect(`/mis-eventos/${eventId}?section=entretenimiento&spotify=connected`);
  } catch (err: any) {
    console.error('Spotify callback error:', err);
    return res.redirect(`/mis-eventos/${eventId}?section=entretenimiento&error=spotify_error`);
  }
}
