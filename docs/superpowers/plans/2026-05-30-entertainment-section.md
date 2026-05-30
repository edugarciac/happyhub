# Entertainment Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la sección Entretenimiento del dashboard de eventos colaborativos con playlist Spotify colaborativa, actividades con votación y recomendaciones IA.

**Architecture:** Sección con dos sub-tabs (Música / Actividades). El organizador conecta Spotify via OAuth para sincronizar canciones aprobadas a una playlist real. Las actividades usan propuestas abiertas + votación + aprobación del organizador. Las recomendaciones IA de actividades usan `ai.ts` + `search.ts` (ya existentes) + tabla `activity_templates` como base de conocimiento creciente (admin-gestionada).

**Tech Stack:** Next.js 14 Pages Router, TypeScript, Neon Postgres (`query` de `@/lib/db`), NextAuth (`getServerSession`), `requireAdminSession` para rutas admin, `zod` para validación, Spotify Web API (Client Credentials para búsqueda, OAuth para playlist), `@anthropic-ai/sdk` via `src/lib/ai.ts`, Tavily via `src/lib/search.ts`, `react-hot-toast`, `lucide-react`.

---

## Mapa de archivos

| Archivo | Acción |
|---|---|
| `database/migrations/014_entertainment_section.sql` | Crear |
| `src/pages/api/entertainment/spotify/search.ts` | Crear — búsqueda tracks (Client Credentials) |
| `src/pages/api/events/collaborative/[id]/entertainment/spotify/connect.ts` | Crear — OAuth redirect |
| `src/pages/api/auth/spotify/callback.ts` | Crear — OAuth callback + store tokens |
| `src/pages/api/events/collaborative/[id]/entertainment/songs.ts` | Crear — GET list + POST suggest |
| `src/pages/api/events/collaborative/[id]/entertainment/songs/[songId].ts` | Crear — PATCH approve/reject + DELETE |
| `src/pages/api/events/collaborative/[id]/entertainment/spotify/sync.ts` | Crear — POST sync to playlist |
| `src/pages/api/events/collaborative/[id]/entertainment/activities.ts` | Crear — GET list + POST propose |
| `src/pages/api/events/collaborative/[id]/entertainment/activities/[activityId].ts` | Crear — PATCH + DELETE |
| `src/pages/api/events/collaborative/[id]/entertainment/activities/[activityId]/vote.ts` | Crear — POST toggle vote |
| `src/pages/api/events/collaborative/[id]/entertainment/activities/suggest.ts` | Crear — POST AI recommendations |
| `src/pages/api/admin/activity-templates.ts` | Crear — GET + POST |
| `src/pages/api/admin/activity-templates/[id].ts` | Crear — PATCH + DELETE |
| `src/components/events/EntertainmentSection.tsx` | Crear — wrapper sub-tabs |
| `src/components/events/SpotifyPlaylistTab.tsx` | Crear — tab música |
| `src/components/events/ActivitiesTab.tsx` | Crear — tab actividades |
| `src/components/events/ActivityAdvisor.tsx` | Crear — modal recomendaciones IA |
| `src/pages/admin/activity-templates.tsx` | Crear — admin CRUD page |
| `src/pages/mis-eventos/[id].tsx` | Modificar — conectar sección |

---

## Task 1: Migración de base de datos

**Files:**
- Create: `database/migrations/014_entertainment_section.sql`

- [ ] **Step 1: Crear el archivo de migración**

```sql
-- database/migrations/014_entertainment_section.sql

-- Canciones sugeridas para el evento
CREATE TABLE IF NOT EXISTS event_entertainment_songs (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  spotify_track_id VARCHAR(100),
  spotify_track_uri VARCHAR(150),
  suggested_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conexión Spotify del organizador (una por evento)
CREATE TABLE IF NOT EXISTS event_spotify_connections (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL UNIQUE REFERENCES collaborative_events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP,
  playlist_id VARCHAR(100),
  playlist_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actividades propuestas para el evento
CREATE TABLE IF NOT EXISTS event_activities (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  proposed_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votos en actividades (toggle, un voto por participante)
CREATE TABLE IF NOT EXISTS event_activity_votes (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES event_activities(id) ON DELETE CASCADE,
  participant_id INTEGER NOT NULL REFERENCES collaborative_event_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, participant_id)
);

-- Base de conocimiento de actividades (admin-gestionada)
CREATE TABLE IF NOT EXISTS activity_templates (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_types TEXT[],
  participant_types TEXT[],
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_songs_event ON event_entertainment_songs(event_id);
CREATE INDEX IF NOT EXISTS idx_activities_event ON event_activities(event_id);
CREATE INDEX IF NOT EXISTS idx_activity_votes_activity ON event_activity_votes(activity_id);
```

- [ ] **Step 2: Ejecutar migración en Neon**

```bash
cd /Users/edu/claude/happyhub
node -e "
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const sql = neon(process.env.DATABASE_URL);
const migration = fs.readFileSync('database/migrations/014_entertainment_section.sql', 'utf8');
sql.apply(null, [migration]).then(() => console.log('OK')).catch(console.error);
"
```

Si el comando anterior no funciona (el módulo puede no estar disponible directamente), ejecutar la migración pegando el SQL directamente en la consola de Neon en https://console.neon.tech.

- [ ] **Step 3: Verificar tablas creadas**

En la consola de Neon o con psql, verificar:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('event_entertainment_songs','event_spotify_connections','event_activities','event_activity_votes','activity_templates');
```
Esperado: 5 filas.

- [ ] **Step 4: Commit**

```bash
git add database/migrations/014_entertainment_section.sql
git commit -m "feat: migración DB sección entretenimiento (canciones, actividades, activity_templates)"
```

---

## Task 2: Spotify OAuth — connect + callback + search

**Files:**
- Create: `src/pages/api/entertainment/spotify/search.ts`
- Create: `src/pages/api/events/collaborative/[id]/entertainment/spotify/connect.ts`
- Create: `src/pages/api/auth/spotify/callback.ts`

**Contexto:** Tres endpoints distintos:
1. `GET /api/entertainment/spotify/search?q=` — búsqueda pública con Client Credentials (sin sesión Spotify del usuario)
2. `GET /api/events/collaborative/[id]/entertainment/spotify/connect` — redirige al organizador a Spotify OAuth
3. `GET /api/auth/spotify/callback` — recibe el code de Spotify, intercambia por tokens, guarda en DB

Variables de entorno necesarias (añadir a `.env.local` y Vercel Console):
```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=https://happyhub.es/api/auth/spotify/callback
```

- [ ] **Step 1: Crear endpoint de búsqueda (Client Credentials)**

```typescript
// src/pages/api/entertainment/spotify/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getClientCredentialsToken(): Promise<string> {
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
  return data.access_token as string;
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
```

- [ ] **Step 2: Crear endpoint OAuth connect (redirige a Spotify)**

```typescript
// src/pages/api/events/collaborative/[id]/entertainment/spotify/connect.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.organizer_id !== userId) return res.status(403).json({ error: 'Solo el organizador puede conectar Spotify' });

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !redirectUri) return res.status(500).json({ error: 'Spotify no configurado' });

  // state encodes eventId:userId para recuperarlos en el callback
  const state = `${eventId}:${userId}`;
  const scopes = 'playlist-modify-public playlist-modify-private';
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    state,
  });

  return res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
}
```

- [ ] **Step 3: Crear OAuth callback (intercambia code → tokens → guarda en DB)**

```typescript
// src/pages/api/auth/spotify/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { code, state, error } = req.query;

  if (error) return res.redirect('/mis-eventos?error=spotify_denied');
  if (!code || !state) return res.redirect('/mis-eventos?error=spotify_invalid');

  // state = "eventId:userId"
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
    // Exchange code for tokens
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
```

- [ ] **Step 4: Verificación manual**

En desarrollo (`.env.local`), añadir:
```
SPOTIFY_CLIENT_ID=<tu client id>
SPOTIFY_CLIENT_SECRET=<tu client secret>
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
```

En la [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), crear una app y añadir `http://localhost:3000/api/auth/spotify/callback` como Redirect URI.

Abrir `http://localhost:3000/api/entertainment/spotify/search?q=bohemian` — debe devolver `{ tracks: [...] }` (requiere estar logueado en HappyHub).

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/entertainment/spotify/search.ts \
        src/pages/api/events/collaborative/[id]/entertainment/spotify/connect.ts \
        src/pages/api/auth/spotify/callback.ts
git commit -m "feat: Spotify OAuth flow y endpoint de búsqueda de tracks"
```

---

## Task 3: Songs API (GET/POST + PATCH/DELETE + sync)

**Files:**
- Create: `src/pages/api/events/collaborative/[id]/entertainment/songs.ts`
- Create: `src/pages/api/events/collaborative/[id]/entertainment/songs/[songId].ts`
- Create: `src/pages/api/events/collaborative/[id]/entertainment/spotify/sync.ts`

- [ ] **Step 1: Crear songs.ts (GET lista + POST sugerir)**

```typescript
// src/pages/api/events/collaborative/[id]/entertainment/songs.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().min(1).max(255),
  artist: z.string().max(255).optional(),
  spotifyTrackId: z.string().max(100).optional(),
  spotifyTrackUri: z.string().max(150).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  if (req.method === 'GET') {
    const [songsResult, spotifyResult] = await Promise.all([
      query(
        `SELECT s.*, p.name as suggested_by_name
         FROM event_entertainment_songs s
         LEFT JOIN collaborative_event_participants p ON p.id = s.suggested_by_participant_id
         WHERE s.event_id = $1 ORDER BY s.created_at ASC`,
        [eventId]
      ),
      query(
        `SELECT playlist_url, playlist_id FROM event_spotify_connections WHERE event_id = $1`,
        [eventId]
      ),
    ]);

    const spotifyConn = spotifyResult.rows[0] || null;
    return res.status(200).json({
      songs: songsResult.rows,
      spotify: spotifyConn
        ? { connected: true, playlistUrl: spotifyConn.playlist_url }
        : { connected: false, playlistUrl: null },
    });
  }

  if (req.method === 'POST') {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { title, artist, spotifyTrackId, spotifyTrackUri } = parsed.data;
    const result = await query(
      `INSERT INTO event_entertainment_songs
         (event_id, title, artist, spotify_track_id, spotify_track_uri, suggested_by_participant_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [eventId, title, artist || null, spotifyTrackId || null, spotifyTrackUri || null, participant?.id || null]
    );
    return res.status(201).json({ song: result.rows[0] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 2: Crear songs/[songId].ts (PATCH approve/reject + DELETE)**

```typescript
// src/pages/api/events/collaborative/[id]/entertainment/songs/[songId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';
import { z } from 'zod';

const patchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const songId = parseInt(req.query.songId as string, 10);
  if (isNaN(eventId) || isNaN(songId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  const songResult = await query(
    `SELECT * FROM event_entertainment_songs WHERE id = $1 AND event_id = $2`,
    [songId, eventId]
  );
  if (songResult.rows.length === 0) return res.status(404).json({ error: 'Canción no encontrada' });
  const song = songResult.rows[0];

  if (req.method === 'PATCH') {
    if (!isOrganizer) return res.status(403).json({ error: 'Solo el organizador puede aprobar canciones' });
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const result = await query(
      `UPDATE event_entertainment_songs SET status = $1 WHERE id = $2 RETURNING *`,
      [parsed.data.status, songId]
    );
    return res.status(200).json({ song: result.rows[0] });
  }

  if (req.method === 'DELETE') {
    const canDelete = isOrganizer || song.suggested_by_participant_id === participant?.id;
    if (!canDelete) return res.status(403).json({ error: 'Sin permiso para eliminar esta canción' });

    await query(`DELETE FROM event_entertainment_songs WHERE id = $1`, [songId]);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 3: Crear spotify/sync.ts (sincroniza canciones aprobadas a playlist)**

```typescript
// src/pages/api/events/collaborative/[id]/entertainment/spotify/sync.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById } from '@/utils/db/collaborative-events';

async function getValidToken(conn: any): Promise<string> {
  if (conn.token_expires_at && new Date(conn.token_expires_at) > new Date()) {
    return conn.access_token;
  }
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${conn.refresh_token}`,
  });
  if (!res.ok) throw new Error('Error refrescando token de Spotify');
  const data = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  await query(
    `UPDATE event_spotify_connections SET access_token = $1, token_expires_at = $2, updated_at = NOW() WHERE event_id = $3`,
    [data.access_token, expiresAt, conn.event_id]
  );
  return data.access_token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.organizer_id !== userId) return res.status(403).json({ error: 'Solo el organizador' });

  const connResult = await query(
    `SELECT * FROM event_spotify_connections WHERE event_id = $1`,
    [eventId]
  );
  if (connResult.rows.length === 0) return res.status(400).json({ error: 'Spotify no conectado' });
  const conn = connResult.rows[0];

  try {
    const token = await getValidToken(conn);

    // Obtener Spotify user ID para crear playlist
    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return res.status(502).json({ error: 'Error obteniendo perfil Spotify' });
    const me = await meRes.json();

    let playlistId = conn.playlist_id;
    let playlistUrl = conn.playlist_url;

    if (!playlistId) {
      // Crear playlist nueva
      const createRes = await fetch(`https://api.spotify.com/v1/users/${me.id}/playlists`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: event.title,
          description: `Playlist colaborativa de ${event.title} - HappyHub`,
          public: true,
        }),
      });
      if (!createRes.ok) return res.status(502).json({ error: 'Error creando playlist' });
      const playlist = await createRes.json();
      playlistId = playlist.id;
      playlistUrl = playlist.external_urls?.spotify || null;

      await query(
        `UPDATE event_spotify_connections SET playlist_id = $1, playlist_url = $2, updated_at = NOW() WHERE event_id = $3`,
        [playlistId, playlistUrl, eventId]
      );
    }

    // Añadir canciones aprobadas con spotify_track_uri
    const songsResult = await query(
      `SELECT spotify_track_uri FROM event_entertainment_songs
       WHERE event_id = $1 AND status = 'approved' AND spotify_track_uri IS NOT NULL`,
      [eventId]
    );

    if (songsResult.rows.length > 0) {
      const uris = songsResult.rows.map((r: any) => r.spotify_track_uri);
      const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris }),
      });
      if (!addRes.ok) return res.status(502).json({ error: 'Error añadiendo canciones a playlist' });
    }

    return res.status(200).json({ ok: true, playlistUrl, tracksAdded: songsResult.rows.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add "src/pages/api/events/collaborative/[id]/entertainment/songs.ts" \
        "src/pages/api/events/collaborative/[id]/entertainment/songs/[songId].ts" \
        "src/pages/api/events/collaborative/[id]/entertainment/spotify/sync.ts"
git commit -m "feat: API canciones Spotify (GET/POST/PATCH/DELETE + sync playlist)"
```

---

## Task 4: Activities API (GET/POST + vote + PATCH/DELETE + suggest IA)

**Files:**
- Create: `src/pages/api/events/collaborative/[id]/entertainment/activities.ts`
- Create: `src/pages/api/events/collaborative/[id]/entertainment/activities/[activityId].ts`
- Create: `src/pages/api/events/collaborative/[id]/entertainment/activities/[activityId]/vote.ts`
- Create: `src/pages/api/events/collaborative/[id]/entertainment/activities/suggest.ts`

- [ ] **Step 1: Crear activities.ts (GET lista con votos + POST proponer)**

```typescript
// src/pages/api/events/collaborative/[id]/entertainment/activities.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  const participantId = participant?.id ?? null;

  if (req.method === 'GET') {
    const result = await query(
      `SELECT a.*,
         COUNT(v.id)::int AS votes_count,
         BOOL_OR(v.participant_id = $2) AS user_voted,
         p.name AS proposed_by_name
       FROM event_activities a
       LEFT JOIN event_activity_votes v ON v.activity_id = a.id
       LEFT JOIN collaborative_event_participants p ON p.id = a.proposed_by_participant_id
       WHERE a.event_id = $1
       GROUP BY a.id, p.name
       ORDER BY a.created_at ASC`,
      [eventId, participantId]
    );
    return res.status(200).json({ activities: result.rows });
  }

  if (req.method === 'POST') {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const result = await query(
      `INSERT INTO event_activities (event_id, title, description, proposed_by_participant_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [eventId, parsed.data.title, parsed.data.description || null, participantId]
    );
    return res.status(201).json({ activity: result.rows[0] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 2: Crear activities/[activityId].ts (PATCH approve/reject + DELETE)**

```typescript
// src/pages/api/events/collaborative/[id]/entertainment/activities/[activityId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';
import { z } from 'zod';

const patchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const activityId = parseInt(req.query.activityId as string, 10);
  if (isNaN(eventId) || isNaN(activityId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  const actResult = await query(
    `SELECT * FROM event_activities WHERE id = $1 AND event_id = $2`,
    [activityId, eventId]
  );
  if (actResult.rows.length === 0) return res.status(404).json({ error: 'Actividad no encontrada' });
  const activity = actResult.rows[0];

  if (req.method === 'PATCH') {
    if (!isOrganizer) return res.status(403).json({ error: 'Solo el organizador puede aprobar actividades' });
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const result = await query(
      `UPDATE event_activities SET status = $1 WHERE id = $2 RETURNING *`,
      [parsed.data.status, activityId]
    );
    return res.status(200).json({ activity: result.rows[0] });
  }

  if (req.method === 'DELETE') {
    const canDelete = isOrganizer || activity.proposed_by_participant_id === participant?.id;
    if (!canDelete) return res.status(403).json({ error: 'Sin permiso' });

    await query(`DELETE FROM event_activities WHERE id = $1`, [activityId]);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 3: Crear activities/[activityId]/vote.ts (toggle voto)**

```typescript
// src/pages/api/events/collaborative/[id]/entertainment/activities/[activityId]/vote.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  const activityId = parseInt(req.query.activityId as string, 10);
  if (isNaN(eventId) || isNaN(activityId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  if (!participant) return res.status(400).json({ error: 'Solo los invitados pueden votar' });

  const existing = await query(
    `SELECT id FROM event_activity_votes WHERE activity_id = $1 AND participant_id = $2`,
    [activityId, participant.id]
  );

  if (existing.rows.length > 0) {
    await query(
      `DELETE FROM event_activity_votes WHERE activity_id = $1 AND participant_id = $2`,
      [activityId, participant.id]
    );
    return res.status(200).json({ action: 'unvoted' });
  } else {
    await query(
      `INSERT INTO event_activity_votes (activity_id, participant_id) VALUES ($1, $2)`,
      [activityId, participant.id]
    );
    return res.status(200).json({ action: 'voted' });
  }
}
```

- [ ] **Step 4: Crear activities/suggest.ts (recomendaciones IA)**

```typescript
// src/pages/api/events/collaborative/[id]/entertainment/activities/suggest.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';
import { generateText } from '@/lib/ai';
import { searchWeb } from '@/lib/search';
import { z } from 'zod';

const suggestSchema = z.object({
  participantTypes: z.array(z.string()).min(1),
  context: z.string().max(500).optional(),
});

interface ActivitySuggestion {
  title: string;
  description: string;
  emoji: string;
  tags: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  const parsed = suggestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { participantTypes, context } = parsed.data;
  const eventType = event.category || 'fiesta';

  // Consultar base de conocimiento
  const templatesResult = await query(
    `SELECT title, description, tags FROM activity_templates
     WHERE $1 = ANY(event_types) OR array_length(event_types, 1) IS NULL
     ORDER BY usage_count DESC LIMIT 10`,
    [eventType]
  );

  const templatesContext = templatesResult.rows.length > 0
    ? templatesResult.rows.map((t: any) =>
        `- ${t.title}${t.description ? ': ' + t.description : ''}`
      ).join('\n')
    : '';

  const searchQuery = `actividades juegos ${eventType} ${participantTypes.join(' ')} fiesta ideas`;
  const webResults = await searchWeb(searchQuery, 5);
  const webContext = webResults.length > 0
    ? webResults.map((r, i) => `${i + 1}. ${r.title}\n${r.content.slice(0, 200)}`).join('\n\n')
    : '';

  const systemPrompt = `Eres un experto en organización de fiestas y eventos sociales en España. Generas ideas de actividades entretenidas, prácticas y culturalmente apropiadas. Respondes SIEMPRE en JSON válido:
{"suggestions":[{"title":"string","description":"string","emoji":"string","tags":["string"]}]}
Genera entre 5 y 8 sugerencias variadas. emoji debe ser relevante. description es breve (1-2 frases en español).`;

  const userPrompt = `Tipo de evento: ${eventType}
Tipo de participantes: ${participantTypes.join(', ')}
${context ? `Contexto adicional: ${context}` : ''}

${templatesContext ? `Actividades de nuestra base de conocimiento:\n${templatesContext}\n` : ''}
${webContext ? `Ideas de internet:\n${webContext}` : ''}

Genera actividades variadas y apropiadas para este evento.`;

  try {
    const aiResponse = await generateText(userPrompt, systemPrompt);
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Respuesta IA inválida' });

    const result = JSON.parse(jsonMatch[0]) as { suggestions: ActivitySuggestion[] };
    return res.status(200).json({ suggestions: result.suggestions });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error generando sugerencias: ' + err.message });
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add "src/pages/api/events/collaborative/[id]/entertainment/activities.ts" \
        "src/pages/api/events/collaborative/[id]/entertainment/activities/[activityId].ts" \
        "src/pages/api/events/collaborative/[id]/entertainment/activities/[activityId]/vote.ts" \
        "src/pages/api/events/collaborative/[id]/entertainment/activities/suggest.ts"
git commit -m "feat: API actividades (CRUD + votación + recomendaciones IA)"
```

---

## Task 5: Admin activity-templates (API + página)

**Files:**
- Create: `src/pages/api/admin/activity-templates.ts`
- Create: `src/pages/api/admin/activity-templates/[id].ts`
- Create: `src/pages/admin/activity-templates.tsx`

- [ ] **Step 1: Crear activity-templates.ts (GET + POST)**

```typescript
// src/pages/api/admin/activity-templates.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);

    if (req.method === 'GET') {
      const result = await query(
        `SELECT * FROM activity_templates ORDER BY usage_count DESC, created_at DESC`
      );
      return res.status(200).json({ success: true, templates: result.rows });
    }

    if (req.method === 'POST') {
      const { title, description, event_types, participant_types, tags, admin_notes } = req.body;
      if (!title?.trim()) return res.status(400).json({ success: false, error: 'El título es obligatorio' });

      const result = await query(
        `INSERT INTO activity_templates (title, description, event_types, participant_types, tags, admin_notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          title.trim(),
          description?.trim() || null,
          event_types || [],
          participant_types || [],
          tags || [],
          admin_notes?.trim() || null,
        ]
      );
      return res.status(201).json({ success: true, template: result.rows[0] });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error in activity-templates API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
```

- [ ] **Step 2: Crear activity-templates/[id].ts (PATCH + DELETE)**

```typescript
// src/pages/api/admin/activity-templates/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { requireAdminSession } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdminSession(req, res);

    const id = parseInt(req.query.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

    if (req.method === 'PATCH') {
      const { title, description, event_types, participant_types, tags, admin_notes } = req.body;
      if (!title?.trim()) return res.status(400).json({ success: false, error: 'El título es obligatorio' });

      const result = await query(
        `UPDATE activity_templates SET
           title = $1, description = $2, event_types = $3,
           participant_types = $4, tags = $5, admin_notes = $6
         WHERE id = $7 RETURNING *`,
        [
          title.trim(),
          description?.trim() || null,
          event_types || [],
          participant_types || [],
          tags || [],
          admin_notes?.trim() || null,
          id,
        ]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Template no encontrado' });
      return res.status(200).json({ success: true, template: result.rows[0] });
    }

    if (req.method === 'DELETE') {
      await query(`DELETE FROM activity_templates WHERE id = $1`, [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ success: false, error: 'No autorizado' });
    console.error('Error in activity-templates/[id] API:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
}
```

- [ ] **Step 3: Crear página admin activity-templates.tsx**

```typescript
// src/pages/admin/activity-templates.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface ActivityTemplate {
  id: number;
  title: string;
  description: string | null;
  event_types: string[];
  participant_types: string[];
  tags: string[];
  usage_count: number;
  admin_notes: string | null;
}

const emptyForm = {
  title: '',
  description: '',
  event_types: [] as string[],
  participant_types: [] as string[],
  tags: '',
  admin_notes: '',
};

const EVENT_TYPE_OPTIONS = ['cumpleaños', 'boda', 'despedida', 'comunión', 'bautizo', 'empresa', 'navidad', 'halloween'];
const PARTICIPANT_TYPE_OPTIONS = ['niños', 'adultos', 'mixto', 'empresa', 'tercera edad', 'jóvenes'];

export default function AdminActivityTemplates() {
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    const res = await fetch('/api/admin/activity-templates');
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openCreate = () => {
    setEditingTemplate(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (t: ActivityTemplate) => {
    setEditingTemplate(t);
    setForm({
      title: t.title,
      description: t.description || '',
      event_types: t.event_types || [],
      participant_types: t.participant_types || [],
      tags: (t.tags || []).join(', '),
      admin_notes: t.admin_notes || '',
    });
    setShowForm(true);
  };

  const toggleArrayItem = (field: 'event_types' | 'participant_types', value: string) => {
    setForm(prev => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('El título es obligatorio'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        event_types: form.event_types,
        participant_types: form.participant_types,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        admin_notes: form.admin_notes || null,
      };
      const url = editingTemplate
        ? `/api/admin/activity-templates/${editingTemplate.id}`
        : '/api/admin/activity-templates';
      const method = editingTemplate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error guardando'); return; }

      toast.success(editingTemplate ? 'Template actualizado' : 'Template creado');
      setShowForm(false);
      fetchTemplates();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: ActivityTemplate) => {
    if (!confirm(`¿Eliminar "${t.title}"?`)) return;
    const res = await fetch(`/api/admin/activity-templates/${t.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Eliminado'); fetchTemplates(); }
    else toast.error('Error eliminando');
  };

  return (
    <>
      <Head><title>Actividades — Admin HappyHub</title></Head>
      <AdminLayout>
        <Toaster />
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Base de conocimiento — Actividades</h1>
              <p className="text-sm text-gray-500 mt-1">
                Plantillas que el asesor IA usa para recomendar actividades. El contador de uso crece automáticamente.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Nueva actividad
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : templates.length === 0 ? (
            <p className="text-gray-400 text-center py-12">Sin templates. Añade el primero.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actividad</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tipos de evento</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Participantes</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Usos</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {templates.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{t.title}</div>
                        {t.description && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(t.event_types || []).map(et => (
                            <span key={et} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{et}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(t.participant_types || []).map(pt => (
                            <span key={pt} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">{pt}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-gray-700">{t.usage_count}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-indigo-600">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(t)} className="text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal crear/editar */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="font-semibold text-gray-900">
                  {editingTemplate ? 'Editar actividad' : 'Nueva actividad'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="ej: Karaoke"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Breve descripción de la actividad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipos de evento</label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPE_OPTIONS.map(et => (
                      <button
                        key={et}
                        type="button"
                        onClick={() => toggleArrayItem('event_types', et)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          form.event_types.includes(et)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-600 hover:border-blue-400'
                        }`}
                      >
                        {et}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipos de participantes</label>
                  <div className="flex flex-wrap gap-2">
                    {PARTICIPANT_TYPE_OPTIONS.map(pt => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => toggleArrayItem('participant_types', pt)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          form.participant_types.includes(pt)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'border-gray-300 text-gray-600 hover:border-purple-400'
                        }`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separados por coma)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="musica, baile, grupal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas (admin)</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    value={form.admin_notes}
                    onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/admin/activity-templates.ts \
        "src/pages/api/admin/activity-templates/[id].ts" \
        src/pages/admin/activity-templates.tsx
git commit -m "feat: admin CRUD base de conocimiento de actividades"
```

---

## Task 6: SpotifyPlaylistTab component

**Files:**
- Create: `src/components/events/SpotifyPlaylistTab.tsx`

- [ ] **Step 1: Crear el componente**

```typescript
// src/components/events/SpotifyPlaylistTab.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Music, Check, X, Trash2, RefreshCw, ExternalLink } from 'lucide-react';

interface Song {
  id: number;
  title: string;
  artist: string | null;
  spotify_track_id: string | null;
  spotify_track_uri: string | null;
  suggested_by_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

interface SpotifyStatus {
  connected: boolean;
  playlistUrl: string | null;
}

interface SpotifyTrack {
  id: string;
  uri: string;
  title: string;
  artist: string;
  albumImage: string | null;
}

interface Props {
  eventId: number;
  isOrganizer: boolean;
  currentParticipantId: number | null;
}

export default function SpotifyPlaylistTab({ eventId, isOrganizer, currentParticipantId }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [spotify, setSpotify] = useState<SpotifyStatus>({ connected: false, playlistUrl: null });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSongs = useCallback(async () => {
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/songs`);
    if (res.ok) {
      const data = await res.json();
      setSongs(data.songs);
      setSpotify(data.spotify);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/entertainment/spotify/search?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.tracks);
          setShowDropdown(true);
        }
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleSelectTrack = async (track: SpotifyTrack) => {
    setShowDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: track.title,
        artist: track.artist,
        spotifyTrackId: track.id,
        spotifyTrackUri: track.uri,
      }),
    });
    if (res.ok) {
      toast.success('Canción añadida');
      fetchSongs();
    } else {
      toast.error('Error añadiendo canción');
    }
  };

  const handleStatus = async (songId: number, status: 'approved' | 'rejected') => {
    setActionId(songId);
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/songs/${songId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setActionId(null);
    if (res.ok) {
      setSongs(prev => prev.map(s => s.id === songId ? { ...s, status } : s));
    } else {
      toast.error('Error actualizando canción');
    }
  };

  const handleDelete = async (songId: number) => {
    setActionId(songId);
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/songs/${songId}`, {
      method: 'DELETE',
    });
    setActionId(null);
    if (res.ok) {
      setSongs(prev => prev.filter(s => s.id !== songId));
      toast.success('Canción eliminada');
    } else {
      toast.error('Error eliminando canción');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/spotify/sync`, {
      method: 'POST',
    });
    const data = await res.json();
    setSyncing(false);
    if (res.ok) {
      toast.success(`Playlist sincronizada (${data.tracksAdded} canciones)`);
      fetchSongs();
    } else {
      toast.error(data.error || 'Error sincronizando');
    }
  };

  const approved = songs.filter(s => s.status === 'approved');
  const pending = songs.filter(s => s.status === 'pending');
  const rejected = songs.filter(s => s.status === 'rejected');

  if (loading) return <div className="p-6 text-gray-400 text-center">Cargando canciones...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* Banner conectar Spotify */}
      {isOrganizer && !spotify.connected && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
          <span className="text-sm text-green-800">
            <strong>🎧 Conecta Spotify</strong> para sincronizar la playlist con tu cuenta
          </span>
          <a
            href={`/api/events/collaborative/${eventId}/entertainment/spotify/connect`}
            className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700"
          >
            Conectar Spotify
          </a>
        </div>
      )}

      {/* Búsqueda de canciones */}
      <div className="relative">
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm pr-8"
          placeholder="Buscar canción en Spotify..."
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
        />
        {searching && (
          <div className="absolute right-3 top-2.5">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
            {searchResults.map(track => (
              <button
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
              >
                {track.albumImage && (
                  <img src={track.albumImage} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{track.title}</div>
                  <div className="text-xs text-gray-500 truncate">{track.artist}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de canciones */}
      {songs.length === 0 ? (
        <p className="text-gray-400 text-center py-8 text-sm">Sin canciones todavía. ¡Busca y añade la primera!</p>
      ) : (
        <div className="space-y-3">
          {/* Aprobadas */}
          {approved.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Aprobadas ({approved.length})
              </div>
              {approved.map(song => (
                <SongRow
                  key={song.id}
                  song={song}
                  isOrganizer={isOrganizer}
                  actionId={actionId}
                  onStatus={handleStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Pendientes */}
          {pending.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Pendientes de aprobación ({pending.length})
              </div>
              {pending.map(song => (
                <SongRow
                  key={song.id}
                  song={song}
                  isOrganizer={isOrganizer}
                  actionId={actionId}
                  onStatus={handleStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Rechazadas — solo visible para organizador */}
          {isOrganizer && rejected.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Rechazadas ({rejected.length})
              </div>
              {rejected.map(song => (
                <SongRow
                  key={song.id}
                  song={song}
                  isOrganizer={isOrganizer}
                  actionId={actionId}
                  onStatus={handleStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sync y enlace playlist */}
      {isOrganizer && spotify.connected && (
        <div className="flex items-center justify-between pt-2 border-t gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sync a Spotify'}
          </button>
          {spotify.playlistUrl && (
            <a
              href={spotify.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-green-700 hover:underline"
            >
              Ver playlist <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function SongRow({ song, isOrganizer, actionId, onStatus, onDelete }: {
  song: Song;
  isOrganizer: boolean;
  actionId: number | null;
  onStatus: (id: number, status: 'approved' | 'rejected') => void;
  onDelete: (id: number) => void;
}) {
  const busy = actionId === song.id;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border mb-1 ${
      song.status === 'approved' ? 'bg-green-50 border-green-100' :
      song.status === 'rejected' ? 'bg-red-50 border-red-100 opacity-60' :
      'bg-white border-gray-100'
    }`}>
      <Music className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{song.title}</div>
        <div className="text-xs text-gray-500 truncate">
          {song.artist}{song.suggested_by_name ? ` · ${song.suggested_by_name}` : ''}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {song.status === 'pending' && isOrganizer && (
          <>
            <button
              onClick={() => onStatus(song.id, 'approved')}
              disabled={busy}
              className="bg-green-100 text-green-700 hover:bg-green-200 p-1.5 rounded"
              title="Aprobar"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onStatus(song.id, 'rejected')}
              disabled={busy}
              className="bg-red-100 text-red-700 hover:bg-red-200 p-1.5 rounded"
              title="Rechazar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {song.status === 'approved' && (
          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✓ Aprobada</span>
        )}
        {song.status === 'rejected' && isOrganizer && (
          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Rechazada</span>
        )}
        <button
          onClick={() => onDelete(song.id)}
          disabled={busy}
          className="text-gray-300 hover:text-red-500 p-1"
          title="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/events/SpotifyPlaylistTab.tsx
git commit -m "feat: componente SpotifyPlaylistTab (sugerencias, aprobación, sync)"
```

---

## Task 7: ActivityAdvisor + ActivitiesTab components

**Files:**
- Create: `src/components/events/ActivityAdvisor.tsx`
- Create: `src/components/events/ActivitiesTab.tsx`

- [ ] **Step 1: Crear ActivityAdvisor.tsx**

```typescript
// src/components/events/ActivityAdvisor.tsx
import { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';

interface ActivitySuggestion {
  title: string;
  description: string;
  emoji: string;
  tags: string[];
}

interface Props {
  eventId: number;
  onAddActivity: (title: string, description: string) => Promise<void>;
  onClose: () => void;
}

const PARTICIPANT_TYPE_OPTIONS = [
  { value: 'niños', label: '👶 Niños' },
  { value: 'adultos', label: '🧑 Adultos' },
  { value: 'mixto', label: '👨‍👩‍👧 Mixto' },
  { value: 'empresa', label: '💼 Empresa' },
  { value: 'tercera edad', label: '👴 Tercera edad' },
  { value: 'jóvenes', label: '🎉 Jóvenes' },
];

export default function ActivityAdvisor({ eventId, onAddActivity, onClose }: Props) {
  const [participantTypes, setParticipantTypes] = useState<string[]>(['adultos']);
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);

  const toggleParticipantType = (value: string) => {
    setParticipantTypes(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleGenerate = async () => {
    if (participantTypes.length === 0) return;
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/activities/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantTypes, context: context || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error generando sugerencias'); return; }
      setSuggestions(data.suggestions);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (suggestion: ActivitySuggestion, index: number) => {
    setAddingIndex(index);
    try {
      await onAddActivity(suggestion.title, suggestion.description);
    } finally {
      setAddingIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Sugerencias de actividades IA</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tipos de participantes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipos de participantes *
            </label>
            <div className="flex flex-wrap gap-2">
              {PARTICIPANT_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleParticipantType(opt.value)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    participantTypes.includes(opt.value)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-gray-300 text-gray-600 hover:border-purple-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contexto adicional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contexto adicional (opcional)
            </label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={2}
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="ej: ambiente tranquilo, espacio pequeño, grupo de 20 personas..."
            />
          </div>

          {/* Botón generar */}
          <button
            onClick={handleGenerate}
            disabled={loading || participantTypes.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando ideas...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generar ideas
              </>
            )}
          </button>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          {/* Sugerencias */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {suggestions.length} ideas generadas
              </div>
              {suggestions.map((s, i) => (
                <div key={i} className="border rounded-lg p-3 hover:bg-purple-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {s.emoji} {s.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>
                      {s.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {s.tags.map(tag => (
                            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleAdd(s, i)}
                      disabled={addingIndex === i}
                      className="flex items-center gap-1 bg-purple-600 text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex-shrink-0"
                    >
                      <Plus className="h-3 w-3" />
                      {addingIndex === i ? '...' : 'Añadir'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear ActivitiesTab.tsx**

```typescript
// src/components/events/ActivitiesTab.tsx
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ThumbsUp, Check, X, Trash2, Sparkles, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import ActivityAdvisor from './ActivityAdvisor';

interface Activity {
  id: number;
  title: string;
  description: string | null;
  proposed_by_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  votes_count: number;
  user_voted: boolean;
}

interface Props {
  eventId: number;
  isOrganizer: boolean;
  currentParticipantId: number | null;
  eventType: string | null;
}

export default function ActivitiesTab({ eventId, isOrganizer, currentParticipantId }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', description: '' });
  const [addingActivity, setAddingActivity] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchActivities = useCallback(async () => {
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/activities`);
    if (res.ok) {
      const data = await res.json();
      setActivities(data.activities);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const handleAddActivity = async (title: string, description: string) => {
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || undefined }),
    });
    if (res.ok) {
      toast.success('Actividad añadida');
      fetchActivities();
    } else {
      toast.error('Error añadiendo actividad');
    }
  };

  const handleAddFromForm = async () => {
    if (!addForm.title.trim()) return;
    setAddingActivity(true);
    await handleAddActivity(addForm.title, addForm.description);
    setAddForm({ title: '', description: '' });
    setShowAddForm(false);
    setAddingActivity(false);
  };

  const handleVote = async (activityId: number) => {
    if (!currentParticipantId) { toast.error('Solo los invitados pueden votar'); return; }
    setActionId(activityId);
    const res = await fetch(
      `/api/events/collaborative/${eventId}/entertainment/activities/${activityId}/vote`,
      { method: 'POST' }
    );
    setActionId(null);
    if (res.ok) {
      const data = await res.json();
      setActivities(prev => prev.map(a =>
        a.id === activityId
          ? {
              ...a,
              user_voted: data.action === 'voted',
              votes_count: data.action === 'voted' ? a.votes_count + 1 : a.votes_count - 1,
            }
          : a
      ));
    }
  };

  const handleStatus = async (activityId: number, status: 'approved' | 'rejected') => {
    setActionId(activityId);
    const res = await fetch(
      `/api/events/collaborative/${eventId}/entertainment/activities/${activityId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }
    );
    setActionId(null);
    if (res.ok) {
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, status } : a));
    } else {
      toast.error('Error actualizando actividad');
    }
  };

  const handleDelete = async (activityId: number) => {
    setActionId(activityId);
    const res = await fetch(
      `/api/events/collaborative/${eventId}/entertainment/activities/${activityId}`,
      { method: 'DELETE' }
    );
    setActionId(null);
    if (res.ok) {
      setActivities(prev => prev.filter(a => a.id !== activityId));
      toast.success('Actividad eliminada');
    } else {
      toast.error('Error eliminando');
    }
  };

  if (loading) return <div className="p-6 text-gray-400 text-center">Cargando actividades...</div>;

  const approved = activities.filter(a => a.status === 'approved');
  const pending = activities.filter(a => a.status === 'pending');
  const rejected = activities.filter(a => a.status === 'rejected');

  return (
    <div className="p-4 space-y-4">
      {/* Banner IA */}
      <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3">
        <span className="text-sm text-purple-800">
          <strong>✨ Asesor IA</strong> · Genera ideas de actividades según tu tipo de fiesta y participantes
        </span>
        <button
          onClick={() => setShowAdvisor(true)}
          className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-purple-700"
        >
          Ver sugerencias
        </button>
      </div>

      {/* Formulario añadir actividad */}
      {showAddForm ? (
        <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            placeholder="Título de la actividad *"
            value={addForm.title}
            onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            rows={2}
            placeholder="Descripción (opcional)"
            value={addForm.description}
            onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddForm(false)} className="text-sm text-gray-500 px-3 py-1.5">
              Cancelar
            </button>
            <button
              onClick={handleAddFromForm}
              disabled={addingActivity || !addForm.title.trim()}
              className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              {addingActivity ? 'Añadiendo...' : 'Añadir'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <Plus className="h-4 w-4" /> Proponer actividad
        </button>
      )}

      {/* Lista de actividades */}
      {activities.length === 0 ? (
        <p className="text-gray-400 text-center py-8 text-sm">Sin actividades todavía. ¡Propón la primera!</p>
      ) : (
        <div className="space-y-3">
          {approved.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Aprobadas ({approved.length})
              </div>
              {approved.map(a => (
                <ActivityRow key={a.id} activity={a} isOrganizer={isOrganizer}
                  actionId={actionId} onVote={handleVote} onStatus={handleStatus} onDelete={handleDelete} />
              ))}
            </div>
          )}
          {pending.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Pendientes ({pending.length})
              </div>
              {pending.map(a => (
                <ActivityRow key={a.id} activity={a} isOrganizer={isOrganizer}
                  actionId={actionId} onVote={handleVote} onStatus={handleStatus} onDelete={handleDelete} />
              ))}
            </div>
          )}
          {isOrganizer && rejected.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Rechazadas ({rejected.length})
              </div>
              {rejected.map(a => (
                <ActivityRow key={a.id} activity={a} isOrganizer={isOrganizer}
                  actionId={actionId} onVote={handleVote} onStatus={handleStatus} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {showAdvisor && (
        <ActivityAdvisor
          eventId={eventId}
          onAddActivity={handleAddActivity}
          onClose={() => setShowAdvisor(false)}
        />
      )}
    </div>
  );
}

function ActivityRow({ activity, isOrganizer, actionId, onVote, onStatus, onDelete }: {
  activity: Activity;
  isOrganizer: boolean;
  actionId: number | null;
  onVote: (id: number) => void;
  onStatus: (id: number, status: 'approved' | 'rejected') => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const busy = actionId === activity.id;

  return (
    <div className={`border rounded-lg p-3 mb-1 ${
      activity.status === 'approved' ? 'bg-green-50 border-green-100' :
      activity.status === 'rejected' ? 'bg-gray-50 border-gray-100 opacity-60' :
      'bg-white border-gray-100'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{activity.title}</div>
          {activity.proposed_by_name && (
            <div className="text-xs text-gray-500">Por {activity.proposed_by_name}</div>
          )}
          {activity.description && expanded && (
            <div className="text-xs text-gray-600 mt-1">{activity.description}</div>
          )}
          {activity.description && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-indigo-500 hover:text-indigo-700 mt-0.5"
            >
              {expanded ? 'Menos' : 'Ver descripción'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Botón votar */}
          <button
            onClick={() => onVote(activity.id)}
            disabled={busy}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
              activity.user_voted
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
          >
            <ThumbsUp className="h-3 w-3" /> {activity.votes_count}
          </button>

          {/* Approve/reject para organizador en pending */}
          {activity.status === 'pending' && isOrganizer && (
            <>
              <button onClick={() => onStatus(activity.id, 'approved')} disabled={busy}
                className="bg-green-100 text-green-700 hover:bg-green-200 p-1.5 rounded" title="Aprobar">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onStatus(activity.id, 'rejected')} disabled={busy}
                className="bg-red-100 text-red-700 hover:bg-red-200 p-1.5 rounded" title="Rechazar">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {activity.status === 'approved' && (
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✓</span>
          )}

          <button onClick={() => onDelete(activity.id)} disabled={busy}
            className="text-gray-300 hover:text-red-500 p-1" title="Eliminar">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/events/ActivityAdvisor.tsx \
        src/components/events/ActivitiesTab.tsx
git commit -m "feat: componentes ActivityAdvisor y ActivitiesTab"
```

---

## Task 8: EntertainmentSection + conectar al dashboard

**Files:**
- Create: `src/components/events/EntertainmentSection.tsx`
- Modify: `src/pages/mis-eventos/[id].tsx`

- [ ] **Step 1: Crear EntertainmentSection.tsx**

```typescript
// src/components/events/EntertainmentSection.tsx
import { useState } from 'react';
import { Music, Gamepad2 } from 'lucide-react';
import SpotifyPlaylistTab from './SpotifyPlaylistTab';
import ActivitiesTab from './ActivitiesTab';
import { Toaster } from 'react-hot-toast';

interface Props {
  eventId: number;
  isOrganizer: boolean;
  currentParticipantId: number | null;
  eventType: string | null;
}

type Tab = 'musica' | 'actividades';

export default function EntertainmentSection({ eventId, isOrganizer, currentParticipantId, eventType }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('musica');

  return (
    <div>
      <Toaster />
      {/* Sub-tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('musica')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'musica'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Music className="h-4 w-4" /> Música
        </button>
        <button
          onClick={() => setActiveTab('actividades')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'actividades'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Gamepad2 className="h-4 w-4" /> Actividades
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'musica' && (
        <SpotifyPlaylistTab
          eventId={eventId}
          isOrganizer={isOrganizer}
          currentParticipantId={currentParticipantId}
        />
      )}
      {activeTab === 'actividades' && (
        <ActivitiesTab
          eventId={eventId}
          isOrganizer={isOrganizer}
          currentParticipantId={currentParticipantId}
          eventType={eventType}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Modificar src/pages/mis-eventos/[id].tsx**

Leer el archivo primero. Añadir el import y reemplazar el placeholder de entretenimiento.

Añadir import al inicio (junto a los otros imports de componentes):
```typescript
import EntertainmentSection from '@/components/events/EntertainmentSection';
```

Reemplazar la línea:
```typescript
case 'entretenimiento': return <SectionPlaceholder label="Entretenimiento" />;
```

Por:
```typescript
case 'entretenimiento':
  return (
    <EntertainmentSection
      eventId={event.id}
      isOrganizer={isOrganizer}
      currentParticipantId={currentParticipantId}
      eventType={event.category}
    />
  );
```

- [ ] **Step 3: Verificar que compila**

```bash
cd /Users/edu/claude/happyhub
npx tsc --noEmit 2>&1 | head -30
```

Esperado: sin errores de tipo relevantes.

- [ ] **Step 4: Commit**

```bash
git add src/components/events/EntertainmentSection.tsx src/pages/mis-eventos/[id].tsx
git commit -m "feat: EntertainmentSection conectada al dashboard /mis-eventos/[id]"
```

---

## Task 9: Build y deploy

**Files:** ninguno nuevo

- [ ] **Step 1: Build de producción limpio**

```bash
cd /Users/edu/claude/happyhub
npm run build 2>&1 | tail -30
```

Esperado: `✓ Compiled successfully` sin errores.

Si hay errores de TypeScript, corregirlos antes de continuar.

- [ ] **Step 2: Verificar rutas API generadas**

El build de Next.js mostrará las páginas. Confirmar que aparecen las nuevas rutas bajo `/api/events/collaborative/[id]/entertainment/` y `/api/admin/activity-templates`.

- [ ] **Step 3: Push a main → deploy automático en Vercel**

```bash
git push origin main
```

Vercel detecta el push y despliega automáticamente.

- [ ] **Step 4: Añadir variables de entorno en Vercel Console**

En [Vercel Console](https://vercel.com) → proyecto happyhub → Settings → Environment Variables, añadir:
```
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_REDIRECT_URI=https://happyhub.es/api/auth/spotify/callback
```

Y en la Spotify Developer Dashboard, añadir `https://happyhub.es/api/auth/spotify/callback` como Redirect URI autorizada.

- [ ] **Step 5: Verificación post-deploy**

1. Abrir `/mis-eventos/[id]?section=entretenimiento` — aparecen los dos sub-tabs (Música / Actividades)
2. Buscar una canción en el campo de búsqueda — aparecen resultados de Spotify
3. Sugerir una canción — aparece en la lista como "pendiente"
4. Como organizador, aprobar la canción — cambia badge a verde
5. Proponer una actividad — aparece en la lista
6. Votar una actividad — el contador sube
7. Abrir "Ver sugerencias IA" — genera actividades con Claude
8. Abrir `/admin/activity-templates` — página CRUD de templates funciona

---

## Self-review

**Spec coverage:**
- ✅ DB migration con 5 tablas
- ✅ Spotify OAuth (connect → callback → tokens en DB)
- ✅ Búsqueda Client Credentials (`/api/entertainment/spotify/search`)
- ✅ Sync playlist (con refresh token automático)
- ✅ Songs CRUD (GET/POST/PATCH/DELETE)
- ✅ Activities CRUD (GET/POST/PATCH/DELETE)
- ✅ Vote toggle
- ✅ AI suggest activities (templates DB + web search + Claude)
- ✅ Admin activity-templates (GET/POST/PATCH/DELETE + página)
- ✅ EntertainmentSection con sub-tabs
- ✅ SpotifyPlaylistTab
- ✅ ActivitiesTab
- ✅ ActivityAdvisor modal
- ✅ Dashboard connection

**Consistencia de tipos:**
- `Song.status: 'pending' | 'approved' | 'rejected'` — consistente en API y componente
- `Activity` incluye `votes_count: number` y `user_voted: boolean` — devueltos por el GET con GROUP BY
- `ActivitySuggestion: { title, description, emoji, tags[] }` — consistente entre suggest.ts y ActivityAdvisor

**Nota sobre `usage_count`:** El spec especifica que cuando se añade una actividad desde una sugerencia IA que coincide por título con un template, se incrementa `usage_count`. Esta lógica requeriría que el frontend envíe el título al backend y el backend haga un `UPDATE activity_templates SET usage_count = usage_count + 1 WHERE title = $1`. Esta lógica está en el handler `activities.ts` POST — si el título del POST coincide con un template existente, incrementar. Se puede añadir como mejora en el POST handler:

```typescript
// En el handler POST de activities.ts, después del INSERT:
await query(
  `UPDATE activity_templates SET usage_count = usage_count + 1 WHERE title = $1`,
  [parsed.data.title]
);
```

Añadir esta línea al Task 4 Step 1 (activities.ts), dentro del bloque `if (req.method === 'POST')` después del INSERT.
