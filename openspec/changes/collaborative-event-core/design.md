# Design: collaborative-event-core

## Architecture

### Stack
- Next.js Pages Router (same as rest of app)
- Neon Postgres via `@neondatabase/serverless`
- NextAuth session for auth
- Tailwind CSS para UI

### Data Layer

Tres nuevas tablas en Postgres:

```sql
collaborative_events          -- el evento principal
collaborative_event_participants -- participantes (incluye organizador)
collaborative_event_timeline  -- guion/timeline del día
```

Las funciones DB viven en `src/utils/db/collaborative-events.ts`, siguiendo el patrón de `src/utils/db/users.ts`.

### Auth flow

- Organizador: requiere sesión activa (NextAuth)
- Participantes invitados: se unen via `invite_code` único (UUID corto)
  - Si tienen sesión → participante vinculado a `user_id`
  - Si no tienen sesión → participante con nombre + email (registro simplificado)
- El `invite_code` se genera al crear el evento (nanoid 8 chars)

### API Routes

```
POST   /api/events/collaborative              → crear evento
GET    /api/events/collaborative/[id]         → dashboard data (evento + participantes + timeline)
PATCH  /api/events/collaborative/[id]         → actualizar evento (solo organizador)
POST   /api/events/collaborative/join/[code]  → unirse via invite link
PATCH  /api/events/collaborative/[id]/participants/[pid]  → actualizar RSVP/rol
GET    /api/events/collaborative/[id]/timeline              → listar timeline
POST   /api/events/collaborative/[id]/timeline              → añadir entrada
PATCH  /api/events/collaborative/[id]/timeline/[tid]        → editar entrada
DELETE /api/events/collaborative/[id]/timeline/[tid]        → eliminar entrada
```

### UI Pages

```
/eventos/crear               → formulario crear evento (requiere sesión)
/eventos/[id]                → dashboard con tabs (Info, Participantes, Timeline)
/eventos/unirse/[inviteCode] → página unirse (funciona sin sesión)
```

### UI Components

```
src/components/events/
  EventForm.tsx           → formulario crear/editar evento
  EventDashboard.tsx      → layout con tabs del evento
  ParticipantList.tsx     → lista de participantes con RSVP status
  TimelineEditor.tsx      → editor del guion del día
  InviteShareCard.tsx     → card para compartir invite link
  EventCategoryPicker.tsx → selector de categoría con iconos
```

## Key Decisions

- **invite_code como nanoid**: más corto y legible en URLs que UUID completo
- **Participante siempre creado al unirse**: incluso si el user ya tiene cuenta, se crea un registro en `collaborative_event_participants` para mantener RSVP y rol
- **Dashboard data en un solo GET**: el endpoint `/api/events/collaborative/[id]` devuelve evento + participantes + timeline para minimizar requests
- **Timeline ordenado por `sort_order` + time**: permite reordenar manualmente
- **Sin real-time por ahora**: polling manual o reload; websockets en fase posterior
