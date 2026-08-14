import { query, queryOne } from './db';

export interface UserSpotifyConnection {
  id: number;
  user_id: number;
  spotify_user_id: string;
  display_name: string | null;
  product: 'premium' | 'free';
  access_token: string;
  refresh_token: string;
  token_expires_at: string | null;
}

export async function getUserSpotifyConnection(userId: number): Promise<UserSpotifyConnection | null> {
  return queryOne<UserSpotifyConnection>(
    `SELECT * FROM user_spotify_connections WHERE user_id = $1`,
    [userId]
  );
}

export async function getUserSpotifyConnectionById(id: number): Promise<UserSpotifyConnection | null> {
  return queryOne<UserSpotifyConnection>(
    `SELECT * FROM user_spotify_connections WHERE id = $1`,
    [id]
  );
}

async function refreshAccessToken(connection: UserSpotifyConnection): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Spotify no configurado');

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token,
    }).toString(),
  });
  if (!res.ok) throw new Error('Error refrescando el token de Spotify');
  const data = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await query(
    `UPDATE user_spotify_connections
     SET access_token = $1, token_expires_at = $2, updated_at = NOW()
     WHERE id = $3`,
    [data.access_token, expiresAt, connection.id]
  );

  return data.access_token as string;
}

/**
 * Returns a valid Spotify access token for the given user connection,
 * refreshing it first if it has expired (or is about to, within 60s).
 */
export async function getValidAccessToken(userConnectionId: number): Promise<string> {
  const connection = await getUserSpotifyConnectionById(userConnectionId);
  if (!connection) throw new Error('Conexión de Spotify no encontrada');

  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
  const stillValid = expiresAt && expiresAt.getTime() - Date.now() > 60_000;
  if (stillValid) return connection.access_token;

  return refreshAccessToken(connection);
}
