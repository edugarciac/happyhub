# Diseño: Sección Entretenimiento — Dashboard Mis Eventos (Fase 1)

**Fecha:** 2026-05-30
**Scope:** Bloque 5 del dashboard `/mis-eventos/[id]` — sección `?section=entretenimiento`
**Depende de:** Bloques 1-4 ya implementados (shell, timeline, invitados, regalo)

---

## Contexto

La sección Entretenimiento cubre dos subsistemas colaborativos: playlist de Spotify (invitados sugieren canciones, organizador aprueba, se sincronizan a Spotify real) y actividades (propuestas abiertas, votación, aprobación organizador, recomendaciones IA con base de conocimiento creciente).

La infraestructura IA (`src/lib/ai.ts` + `src/lib/search.ts`) ya existe y se reutiliza igual que en la sección Regalo.

**Fase 2 (fuera de este spec):** Generación de canción personalizada con IA (inputs colectivos → audio).

---

## Base de datos

Migración: `database/migrations/014_entertainment_section.sql`

```sql
-- Canciones sugeridas para el evento
CREATE TABLE IF NOT EXISTS event_entertainment_songs (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  spotify_track_id VARCHAR(100),
  spotify_track_uri VARCHAR(150),
  suggested_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending | approved | rejected
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
  status VARCHAR(20) DEFAULT 'pending',  -- pending | approved | rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votos en actividades (toggle)
CREATE TABLE IF NOT EXISTS event_activity_votes (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES event_activities(id) ON DELETE CASCADE,
  participant_id INTEGER NOT NULL REFERENCES collaborative_event_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, participant_id)
);

-- Base de conocimiento de actividades (admin-gestionada, crece con uso)
CREATE TABLE IF NOT EXISTS activity_templates (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_types TEXT[],         -- ej: ['cumpleaños', 'boda', 'despedida']
  participant_types TEXT[],   -- ej: ['niños', 'adultos', 'mixto', 'empresa']
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_songs_event ON event_entertainment_songs(event_id);
CREATE INDEX IF NOT EXISTS idx_activities_event ON event_activities(event_id);
CREATE INDEX IF NOT EXISTS idx_activity_votes_activity ON event_activity_votes(activity_id);
```

---

## Integración Spotify

### Variables de entorno

```bash
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=https://happyhub.es/api/auth/spotify/callback
```

### OAuth flow (solo el organizador)

1. Click "Conectar Spotify" → GET `/api/events/collaborative/[id]/entertainment/spotify/connect`
2. Handler redirige a `https://accounts.spotify.com/authorize` con scopes `playlist-modify-public playlist-modify-private` y `state=eventId`
3. Spotify redirige a `/api/auth/spotify/callback?code=...&state=eventId`
4. Handler intercambia code por tokens → INSERT en `event_spotify_connections`
5. Redirige de vuelta a `/mis-eventos/[eventId]?section=entretenimiento`

### Búsqueda de canciones (todos los invitados)

Los invitados escriben en el campo de búsqueda → servidor llama a `https://api.spotify.com/v1/search` usando **Client Credentials** (token de app, no de usuario). No requiere que los invitados tengan cuenta Spotify.

### Sync a playlist

`POST /api/events/collaborative/[id]/entertainment/spotify/sync`:
1. Obtener `event_spotify_connections` por event_id
2. Si `token_expires_at < now`, refrescar token con `refresh_token` y actualizar registro
3. Si no existe `playlist_id`, crear playlist vía `POST /v1/users/{user_id}/playlists` con nombre del evento
4. Obtener todas las canciones con `status = 'approved'` que tengan `spotify_track_uri`
5. `POST /v1/playlists/{playlist_id}/tracks` con los URIs
6. Guardar `playlist_id` y `playlist_url` en la tabla

Si el organizador no ha conectado Spotify, el botón "Sync" no aparece. Las canciones se pueden seguir sugiriendo y aprobando normalmente.

---

## API endpoints

### Música

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/events/collaborative/[id]/entertainment/songs` | sesión | Lista canciones + estado Spotify |
| POST | `/api/events/collaborative/[id]/entertainment/songs` | sesión | Sugerir canción |
| PATCH | `/api/events/collaborative/[id]/entertainment/songs/[songId]` | organizador | approve/reject |
| DELETE | `/api/events/collaborative/[id]/entertainment/songs/[songId]` | suggester u organizador | Eliminar |
| GET | `/api/events/collaborative/[id]/entertainment/spotify/connect` | organizador | Inicia OAuth |
| GET | `/api/auth/spotify/callback` | — | Callback OAuth |
| POST | `/api/events/collaborative/[id]/entertainment/spotify/sync` | organizador | Sync a playlist |
| GET | `/api/entertainment/spotify/search?q=` | sesión | Búsqueda de tracks (Client Credentials) |

**GET songs response:**
```typescript
{
  songs: Song[];
  spotify: { connected: boolean; playlistUrl: string | null } | null;
}
```

**POST songs body:**
```typescript
{ title: string; artist?: string; spotifyTrackId?: string; spotifyTrackUri?: string }
```

### Actividades

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/events/collaborative/[id]/entertainment/activities` | sesión | Lista actividades con votos |
| POST | `/api/events/collaborative/[id]/entertainment/activities` | sesión | Proponer actividad |
| POST | `.../activities/[activityId]/vote` | sesión | Toggle voto |
| PATCH | `.../activities/[activityId]` | organizador | approve/reject |
| DELETE | `.../activities/[activityId]` | proponente u organizador | Eliminar |
| POST | `.../activities/suggest` | sesión | Recomendaciones IA |

**GET activities response:**
```typescript
{
  activities: (Activity & { votes_count: number; user_voted: boolean })[];
}
```

**POST suggest body:**
```typescript
{ participantTypes: string[]; context?: string }
// context: texto libre opcional ("son familia, mayores de 60 años, ambiente tranquilo")
```

**POST suggest response:**
```typescript
{ suggestions: { title: string; description: string; emoji: string; tags: string[] }[] }
```

**Lógica suggest:**
1. Buscar en `activity_templates` donde `event_types @> ARRAY[$eventType]` ORDER BY usage_count DESC LIMIT 10
2. `searchWeb("actividades para [eventType] [participantTypes] fiesta")`
3. Claude recibe los templates + resultados web → genera 5-8 sugerencias
4. Al hacer "+ Añadir como propuesta" desde la UI: POST activities + si la sugerencia viene de un template (por título), `UPDATE activity_templates SET usage_count = usage_count + 1`

### Admin — base de conocimiento

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/activity-templates` | Lista todos los templates |
| POST | `/api/admin/activity-templates` | Crear template |
| PATCH | `/api/admin/activity-templates/[id]` | Actualizar |
| DELETE | `/api/admin/activity-templates/[id]` | Eliminar |

---

## Componentes

### `EntertainmentSection.tsx`

**Props:** `{ eventId, isOrganizer, currentParticipantId, eventType }`

Gestiona el sub-tab activo (`musica` | `actividades`) con estado local. Renderiza `SpotifyPlaylistTab` o `ActivitiesTab`.

### `SpotifyPlaylistTab.tsx`

**Props:** `{ eventId, isOrganizer, currentParticipantId }`

```
SpotifyPlaylistTab
├── Banner "Conectar Spotify" (si isOrganizer y no conectado)
├── Campo búsqueda → GET /api/spotify/search?q=... (server-side search)
│   └── Dropdown con resultados (título + artista + previsualización)
├── Lista de canciones agrupadas por status
│   ├── Aprobadas: badge verde
│   ├── Pendientes: botones ✓/✗ (solo organizador) + badge amarillo
│   └── Rechazadas: badge rojo, visibles solo para organizador
├── Botón "Sync a Spotify" (solo si organizer y conectado)
└── Enlace playlist Spotify (si existe)
```

### `ActivitiesTab.tsx`

**Props:** `{ eventId, isOrganizer, currentParticipantId, eventType }`

```
ActivitiesTab
├── Banner "✨ Ver sugerencias IA" → abre ActivityAdvisor
├── Lista de actividades
│   ├── Votos: botón 👍 (toggle, todos los participantes)
│   ├── Status badge (pending/approved/rejected)
│   └── Botones approve/reject (solo organizador, en pending)
├── Formulario inline "Proponer actividad" (título + descripción opcional)
└── ActivityAdvisor (modal)
```

### `ActivityAdvisor.tsx`

Modal similar a `GiftAdvisor.tsx`.

```
ActivityAdvisor
├── Checkboxes tipos de participantes (niños, adultos, mixto, empresa, tercera edad)
├── Textarea contexto libre (opcional)
├── Botón "Generar ideas" → POST suggest
├── Spinner de carga
└── Lista sugerencias (emoji + título + descripción)
    └── Botón "+ Añadir como propuesta" → POST activities
```

---

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `database/migrations/014_entertainment_section.sql` | Crear |
| `src/pages/api/events/collaborative/[id]/entertainment/songs.ts` | Crear (GET + POST) |
| `src/pages/api/events/collaborative/[id]/entertainment/songs/[songId].ts` | Crear (PATCH + DELETE) |
| `src/pages/api/events/collaborative/[id]/entertainment/spotify/connect.ts` | Crear (GET → OAuth redirect) |
| `src/pages/api/events/collaborative/[id]/entertainment/spotify/sync.ts` | Crear (POST) |
| `src/pages/api/auth/spotify/callback.ts` | Crear (OAuth callback) |
| `src/pages/api/entertainment/spotify/search.ts` | Crear (GET, Client Credentials search) |
| `src/pages/api/events/collaborative/[id]/entertainment/activities.ts` | Crear (GET + POST) |
| `src/pages/api/events/collaborative/[id]/entertainment/activities/[activityId].ts` | Crear (PATCH + DELETE) |
| `src/pages/api/events/collaborative/[id]/entertainment/activities/[activityId]/vote.ts` | Crear (POST toggle) |
| `src/pages/api/events/collaborative/[id]/entertainment/activities/suggest.ts` | Crear (POST IA) |
| `src/pages/api/admin/activity-templates.ts` | Crear (GET + POST) |
| `src/pages/api/admin/activity-templates/[id].ts` | Crear (PATCH + DELETE) |
| `src/components/events/EntertainmentSection.tsx` | Crear |
| `src/components/events/SpotifyPlaylistTab.tsx` | Crear |
| `src/components/events/ActivitiesTab.tsx` | Crear |
| `src/components/events/ActivityAdvisor.tsx` | Crear |
| `src/pages/admin/activity-templates.tsx` | Crear |
| `src/pages/mis-eventos/[id].tsx` | Modificar (conectar sección entretenimiento) |

---

## Lo que NO entra en este spec

- Fase 2: Generación de canción personalizada con IA (inputs colectivos → audio)
- Notificaciones cuando alguien sugiere una canción o propone una actividad
- Reordenación drag-and-drop de canciones aprobadas en la playlist
- Reproducción de preview de Spotify embebida (solo metadatos y link)
- Moderación automática de propuestas
