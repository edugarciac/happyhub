## Why

El evento colaborativo es el diferenciador principal de HappyHub. Hoy no existe una solucion integrada para que un grupo organice un evento juntos: se usan Notion para tareas, WhatsApp para decisiones, Google Photos para fotos, y Bizum para repartir gastos. Unificar todo en un flujo especifico para eventos crea un producto con network effect (todo el grupo necesita usarlo) y viralidad natural (cada nuevo evento trae participantes nuevos).

Casos de uso principales:
- Fin de curso (colegios, academias)
- Despedida de soltero/a en grupo
- Reunion familiar anual
- Aniversario de empresa
- Graduacion universitaria
- Team building disenado por el equipo

## What changes

- Nuevo tipo de evento: "Evento colaborativo" con flujo diferenciado
- El organizador crea el evento, define fecha, descripcion y roles necesarios
- Sistema de invitaciones: link unico para unirse al evento
- Panel del evento con secciones: info, participantes, tareas, votaciones, timeline, fotos, gastos
- Cada participante tiene su vista personalizada con sus tareas y lo que debe
- Timeline compartido del dia del evento (guion)
- Notificaciones push/email/WhatsApp sobre actividad del evento

## Capabilities

### New capabilities
- `collaborative-event-create`: Crear evento colaborativo con fecha, descripcion, categorias de roles
- `collaborative-event-invite`: Sistema de invitaciones via link unico (no requiere registro previo)
- `collaborative-event-participants`: Gestion de participantes, roles, RSVP
- `collaborative-event-dashboard`: Panel central del evento con todas las secciones
- `collaborative-event-timeline`: Guion/timeline del dia del evento editable por organizador
- `collaborative-event-notifications`: Notificaciones de actividad (nuevas tareas, votaciones, gastos)

### Modified capabilities
- Auth: invitados pueden unirse via link sin registro completo (registro simplificado nombre + email)
- Area privada: seccion "Mis eventos colaborativos" con eventos activos y pasados

## Impact

**Database:**

```sql
-- Evento colaborativo
CREATE TABLE collaborative_events (
  id SERIAL PRIMARY KEY,
  organizer_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- fin-de-curso, despedida, reunion-familiar, etc.
  event_date DATE,
  event_time TIME,
  location VARCHAR(500),
  invite_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'planning', -- planning, active, event-day, completed, cancelled
  cover_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Participantes
CREATE TABLE collaborative_event_participants (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(100) DEFAULT 'participant', -- organizer, co-organizer, participant
  rsvp_status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, declined, maybe
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Timeline del dia
CREATE TABLE collaborative_event_timeline (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  time TIME NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  responsible_participant_id INTEGER REFERENCES collaborative_event_participants(id),
  sort_order INTEGER DEFAULT 0
);
```

**API endpoints:**
- `POST /api/events/collaborative` - Crear evento colaborativo
- `GET /api/events/collaborative/[id]` - Detalle del evento (dashboard data)
- `PATCH /api/events/collaborative/[id]` - Actualizar evento
- `POST /api/events/collaborative/join/[inviteCode]` - Unirse via invite link
- `GET /api/events/collaborative/[id]/participants` - Listar participantes
- `PATCH /api/events/collaborative/[id]/participants/[pid]` - Actualizar RSVP/rol
- `GET/POST/PATCH/DELETE /api/events/collaborative/[id]/timeline` - CRUD timeline

**UI pages:**
- `/eventos/crear` - Crear evento colaborativo
- `/eventos/[id]` - Dashboard del evento (tabs: info, participantes, tareas, votaciones, fotos, gastos)
- `/eventos/unirse/[inviteCode]` - Pagina de union via invite link
- `/area-privada` - Seccion "Mis eventos" anadida

**UI components:**
- `EventDashboard` - Layout con tabs para todas las secciones
- `ParticipantList` - Lista de participantes con RSVP status
- `TimelineEditor` - Editor de timeline del dia
- `InviteShareCard` - Card para compartir invite link (WhatsApp, copiar, QR)
- `EventCategoryPicker` - Selector de categoria con iconos
