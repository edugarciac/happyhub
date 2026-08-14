-- Proper many-to-many link between the activity catalog (activity_templates)
-- and the real event_types table, replacing the hardcoded/free-text
-- event_types TEXT[] tag array.
CREATE TABLE IF NOT EXISTS activity_template_event_types (
  activity_template_id INTEGER NOT NULL REFERENCES activity_templates(id) ON DELETE CASCADE,
  event_type_id INTEGER NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_template_id, event_type_id)
);

-- Backfill best-effort: match each existing text tag against event_types.name.
-- Tags with no match are left unbackfilled (activity_templates.event_types
-- TEXT[] is kept, not dropped, so nothing is lost — see backfill script for
-- the report of unmatched tags to review manually).
INSERT INTO activity_template_event_types (activity_template_id, event_type_id)
SELECT DISTINCT t.id, et.id
FROM activity_templates t
CROSS JOIN LATERAL unnest(t.event_types) AS tag(name)
JOIN event_types et ON et.name ILIKE tag.name
ON CONFLICT DO NOTHING;

-- Tracks which catalog entry (if any) an event activity was added from, so
-- usage_count can be incremented and so a later "propose to catalog" isn't
-- offered for something that's already a catalog activity.
ALTER TABLE event_activities
  ADD COLUMN IF NOT EXISTS source_template_id INTEGER REFERENCES activity_templates(id) ON DELETE SET NULL;

-- User-proposed activities awaiting admin review for inclusion in the catalog.
CREATE TABLE IF NOT EXISTS activity_catalog_proposals (
  id SERIAL PRIMARY KEY,
  event_activity_id INTEGER NOT NULL REFERENCES event_activities(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  proposed_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Only one pending proposal per source activity at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_pending_per_activity
  ON activity_catalog_proposals (event_activity_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_proposals_status ON activity_catalog_proposals(status);
