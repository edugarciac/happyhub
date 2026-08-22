import { query, queryOne } from '@/lib/db';

export interface CollaborativeEvent {
  id: number;
  organizer_id: number;
  title: string;
  description: string | null;
  category: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  invite_code: string;
  status: 'planning' | 'active' | 'event-day' | 'completed' | 'cancelled';
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollaborativeEventParticipant {
  id: number;
  event_id: number;
  user_id: number | null;
  name: string;
  email: string | null;
  role: 'organizer' | 'co-organizer' | 'participant';
  rsvp_status: 'pending' | 'confirmed' | 'declined' | 'maybe';
  joined_at: string;
}

export interface CollaborativeEventTimeline {
  id: number;
  event_id: number;
  time: string | null;
  title: string;
  description: string | null;
  responsible_participant_id: number | null;
  sort_order: number;
  // Nuevos campos del dashboard
  phase: 'before' | 'during' | 'after';
  emoji: string | null;
  hito_type: string | null;
  detail_data: Record<string, any> | null;
  completed: boolean;
}

export async function ensureCollaborativeEventsSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS collaborative_events (
      id SERIAL PRIMARY KEY,
      organizer_id INTEGER NOT NULL REFERENCES users(id),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      event_date DATE,
      event_time TIME,
      location VARCHAR(500),
      invite_code VARCHAR(50) UNIQUE NOT NULL,
      status VARCHAR(50) DEFAULT 'planning',
      cover_image_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS collaborative_event_participants (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      role VARCHAR(100) DEFAULT 'participant',
      rsvp_status VARCHAR(50) DEFAULT 'pending',
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS collaborative_event_timeline (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
      time TIME NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      responsible_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_collab_events_organizer ON collaborative_events(organizer_id);
    CREATE INDEX IF NOT EXISTS idx_collab_events_invite ON collaborative_events(invite_code);
    CREATE INDEX IF NOT EXISTS idx_collab_participants_event ON collaborative_event_participants(event_id);
    CREATE INDEX IF NOT EXISTS idx_collab_participants_user ON collaborative_event_participants(user_id);
    CREATE INDEX IF NOT EXISTS idx_collab_timeline_event ON collaborative_event_timeline(event_id);
  `);
}

function generateInviteCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createCollaborativeEvent(data: {
  organizer_id: number;
  title: string;
  description?: string;
  category?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
  organizer_name: string;
  organizer_email: string;
}): Promise<CollaborativeEvent> {
  const invite_code = generateInviteCode();

  const event = await queryOne<CollaborativeEvent>(
    `INSERT INTO collaborative_events
      (organizer_id, title, description, category, event_date, event_time, location, invite_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.organizer_id,
      data.title,
      data.description || null,
      data.category || null,
      data.event_date || null,
      data.event_time || null,
      data.location || null,
      invite_code,
    ]
  );

  if (!event) throw new Error('Failed to create collaborative event');

  // Add organizer as participant
  await query(
    `INSERT INTO collaborative_event_participants
      (event_id, user_id, name, email, role, rsvp_status)
     VALUES ($1, $2, $3, $4, 'organizer', 'confirmed')`,
    [event.id, data.organizer_id, data.organizer_name, data.organizer_email]
  );

  return event;
}

export async function getCollaborativeEventById(id: number): Promise<CollaborativeEvent | null> {
  return queryOne<CollaborativeEvent>(
    'SELECT * FROM collaborative_events WHERE id = $1',
    [id]
  );
}

export async function getCollaborativeEventByInviteCode(code: string): Promise<CollaborativeEvent | null> {
  return queryOne<CollaborativeEvent>(
    'SELECT * FROM collaborative_events WHERE invite_code = $1',
    [code]
  );
}

export async function getEventsByOrganizer(userId: number): Promise<CollaborativeEvent[]> {
  const result = await query<CollaborativeEvent>(
    'SELECT * FROM collaborative_events WHERE organizer_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function getEventsByParticipant(userId: number): Promise<CollaborativeEvent[]> {
  const result = await query<CollaborativeEvent>(
    `SELECT ce.* FROM collaborative_events ce
     JOIN collaborative_event_participants cep ON cep.event_id = ce.id
     WHERE cep.user_id = $1 AND ce.organizer_id != $1
     ORDER BY ce.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function updateCollaborativeEvent(
  id: number,
  data: Partial<Pick<CollaborativeEvent, 'title' | 'description' | 'category' | 'event_date' | 'event_time' | 'location' | 'status'>>
): Promise<CollaborativeEvent | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
  }

  if (fields.length === 0) return getCollaborativeEventById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  return queryOne<CollaborativeEvent>(
    `UPDATE collaborative_events SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
}

export async function getParticipants(eventId: number): Promise<CollaborativeEventParticipant[]> {
  const result = await query<CollaborativeEventParticipant>(
    'SELECT * FROM collaborative_event_participants WHERE event_id = $1 ORDER BY joined_at ASC',
    [eventId]
  );
  return result.rows;
}

export async function getParticipantByUserId(
  eventId: number,
  userId: number
): Promise<CollaborativeEventParticipant | null> {
  return queryOne<CollaborativeEventParticipant>(
    'SELECT * FROM collaborative_event_participants WHERE event_id = $1 AND user_id = $2',
    [eventId, userId]
  );
}

export async function addParticipant(data: {
  event_id: number;
  user_id?: number;
  name: string;
  email?: string;
  role?: string;
}): Promise<CollaborativeEventParticipant> {
  const participant = await queryOne<CollaborativeEventParticipant>(
    `INSERT INTO collaborative_event_participants
      (event_id, user_id, name, email, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (event_id, user_id) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [
      data.event_id,
      data.user_id || null,
      data.name,
      data.email || null,
      data.role || 'participant',
    ]
  );
  if (!participant) throw new Error('Failed to add participant');
  return participant;
}

export async function linkParticipantsToUser(userId: number, email: string): Promise<void> {
  // Skips rows whose event already has this user_id on a different row
  // (e.g. the user is already the organizer) to avoid violating the
  // UNIQUE(event_id, user_id) constraint on collaborative_event_participants.
  await query(
    `UPDATE collaborative_event_participants p
     SET user_id = $1
     WHERE p.user_id IS NULL
       AND lower(p.email) = lower($2)
       AND NOT EXISTS (
         SELECT 1 FROM collaborative_event_participants p2
         WHERE p2.event_id = p.event_id AND p2.user_id = $1
       )`,
    [userId, email]
  );
}

export async function updateParticipant(
  participantId: number,
  data: Partial<Pick<CollaborativeEventParticipant, 'rsvp_status' | 'role'>>
): Promise<CollaborativeEventParticipant | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.rsvp_status !== undefined) {
    fields.push(`rsvp_status = $${idx++}`);
    values.push(data.rsvp_status);
  }
  if (data.role !== undefined) {
    fields.push(`role = $${idx++}`);
    values.push(data.role);
  }

  if (fields.length === 0) return null;

  values.push(participantId);
  return queryOne<CollaborativeEventParticipant>(
    `UPDATE collaborative_event_participants SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
}

export async function getTimeline(eventId: number): Promise<CollaborativeEventTimeline[]> {
  const result = await query<CollaborativeEventTimeline>(
    'SELECT * FROM collaborative_event_timeline WHERE event_id = $1 ORDER BY sort_order ASC, time ASC',
    [eventId]
  );
  return result.rows;
}

export async function addTimelineEntry(data: {
  event_id: number;
  time: string;
  title: string;
  description?: string;
  responsible_participant_id?: number;
  sort_order?: number;
}): Promise<CollaborativeEventTimeline> {
  const entry = await queryOne<CollaborativeEventTimeline>(
    `INSERT INTO collaborative_event_timeline
      (event_id, time, title, description, responsible_participant_id, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.event_id,
      data.time,
      data.title,
      data.description || null,
      data.responsible_participant_id || null,
      data.sort_order ?? 0,
    ]
  );
  if (!entry) throw new Error('Failed to add timeline entry');
  return entry;
}

export async function updateTimelineEntry(
  id: number,
  data: Partial<Pick<CollaborativeEventTimeline, 'time' | 'title' | 'description' | 'responsible_participant_id' | 'sort_order'>>
): Promise<CollaborativeEventTimeline | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(val);
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  return queryOne<CollaborativeEventTimeline>(
    `UPDATE collaborative_event_timeline SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
}

export async function deleteTimelineEntry(id: number): Promise<void> {
  await query('DELETE FROM collaborative_event_timeline WHERE id = $1', [id]);
}
