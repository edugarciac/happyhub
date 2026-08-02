// src/pages/api/events/collaborative/[id]/entertainment/spotify/connect.ts
import crypto from 'crypto';
import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth } from '@/lib/apiMiddleware';

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, userId, isOrganizer } = ctx;
  if (!isOrganizer) return res.status(403).json({ error: 'Solo el organizador puede conectar Spotify' });

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !redirectUri) return res.status(500).json({ error: 'Spotify no configurado' });

  const hmacSecret = process.env.NEXTAUTH_SECRET;
  if (!hmacSecret) return res.status(500).json({ error: 'NEXTAUTH_SECRET no configurado' });
  const hmac = crypto.createHmac('sha256', hmacSecret);
  hmac.update(`${eventId}:${userId}`);
  const sig = hmac.digest('hex');
  const state = `${eventId}:${userId}:${sig}`;
  const scopes = 'playlist-modify-public playlist-modify-private';
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    state,
  });

  return res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});
