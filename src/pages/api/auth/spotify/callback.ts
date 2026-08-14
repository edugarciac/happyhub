// src/pages/api/auth/spotify/callback.ts
import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { code, state, error } = req.query;

  if (error) {
    console.error('[spotify/callback] Spotify returned an error:', error);
    return res.redirect('/area-privada?error=spotify_denied');
  }
  if (!code || !state) {
    console.error('[spotify/callback] Missing code or state', { hasCode: !!code, hasState: !!state });
    return res.redirect('/area-privada?error=spotify_invalid');
  }

  const parts = (state as string).split(':');
  if (parts.length < 2) {
    console.error('[spotify/callback] Malformed state param:', state);
    return res.redirect('/area-privada?error=spotify_invalid');
  }
  const [userIdStr, sig] = parts;
  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId)) {
    console.error('[spotify/callback] Non-numeric userId in state:', userIdStr);
    return res.redirect('/area-privada?error=spotify_invalid');
  }

  // Verificar firma HMAC
  const hmacSecret = process.env.NEXTAUTH_SECRET;
  if (!hmacSecret) {
    console.error('[spotify/callback] NEXTAUTH_SECRET not configured');
    return res.redirect('/area-privada?error=spotify_config');
  }
  const expectedSig = crypto.createHmac('sha256', hmacSecret)
    .update(`${userIdStr}`).digest('hex');
  if (sig !== expectedSig) {
    console.error('[spotify/callback] HMAC signature mismatch for userId:', userId);
    return res.redirect('/area-privada?error=spotify_invalid');
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    console.error('[spotify/callback] Missing Spotify env vars', {
      hasClientId: !!clientId, hasClientSecret: !!clientSecret, hasRedirectUri: !!redirectUri,
    });
    return res.redirect('/area-privada?error=spotify_config');
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
      const errBody = await tokenRes.text();
      console.error('[spotify/callback] Token exchange failed', {
        status: tokenRes.status,
        body: errBody,
        redirectUriUsed: redirectUri,
      });
      return res.redirect('/area-privada?error=spotify_token');
    }

    const tokenData = await tokenRes.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!meRes.ok) {
      const errBody = await meRes.text();
      console.error('[spotify/callback] /v1/me failed', { status: meRes.status, body: errBody });
      return res.redirect('/area-privada?error=spotify_profile');
    }
    const me = await meRes.json();

    await query(
      `INSERT INTO user_spotify_connections
         (user_id, spotify_user_id, display_name, product, access_token, refresh_token, token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         spotify_user_id = EXCLUDED.spotify_user_id,
         display_name = EXCLUDED.display_name,
         product = EXCLUDED.product,
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         token_expires_at = EXCLUDED.token_expires_at,
         updated_at = NOW()`,
      [userId, me.id, me.display_name || null, me.product || 'free', tokenData.access_token, tokenData.refresh_token, expiresAt]
    );

    console.log('[spotify/callback] Connected successfully for userId:', userId);
    return res.redirect('/area-privada?spotify=connected');
  } catch (err: any) {
    console.error('[spotify/callback] Unexpected error:', err);
    return res.redirect('/area-privada?error=spotify_error');
  }
}
