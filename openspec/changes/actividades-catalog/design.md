## Context

Existing pieces (`database/migrations/014_entertainment_section.sql`, `src/pages/admin/activity-templates.tsx`, `src/pages/api/admin/activity-templates.ts`/`[id].ts`, `src/components/events/ActivitiesTab.tsx`, `ActivityAdvisor.tsx`):

- `activity_templates(id, title, description, event_types TEXT[], participant_types TEXT[], tags TEXT[], usage_count, admin_notes)` — admin-managed, CRUD already fully built at `/admin/activity-templates`.
- `event_types TEXT[]` values come from a hardcoded frontend list (`EVENT_TYPE_OPTIONS = ['cumpleaños','boda','despedida','comunión','bautizo','empresa','navidad','halloween']`) in `admin/activity-templates.tsx` — not the real `event_types` table (`id`, `name`, `image_url`, `active`, `sort_order`, `features` — used by bookings/`service_catalog`).
- `ActivitiesTab.tsx` only offers: (a) manually add a freeform activity, (b) open `ActivityAdvisor` → AI suggestions grounded in `activity_templates` via `suggest.ts`, which likely queries by `participant_types`/`event_types` tags (confirm exact query at implementation time) then calls `src/lib/ai.ts` (`generateText`, Claude Haiku). No direct "browse the catalog" list exists.
- `event_activities(id, event_id, title, description, proposed_by_participant_id, status, created_at)` + `event_activity_votes` — event-local activities, unrelated to the catalog today (an activity added from `ActivityAdvisor` becomes a plain `event_activities` row, same as a manually-typed one, with no back-reference to any `activity_templates` row).
- `collaborative_events.category` is a free-text field set at event creation — expected to loosely correspond to `event_types.name` values but not FK-constrained (confirm exact category value set at implementation time by checking the event-creation form's options against `event_types.name`).

## Goals / Non-Goals

**Goals:**
- Admins manage one clearly-labeled catalog ("Catálogo de actividades") tied to real event types.
- Participants can browse and pick directly from the catalog inside an event, not just via AI suggestions.
- A good user-added activity can become a catalog entry through an explicit admin-reviewed proposal step.
- Reuse the existing `activity_templates` table and admin CRUD rather than building a parallel one.

**Non-Goals (this phase):**
- Notifying the proposer when their proposal is approved/rejected — the admin queue is enough for now; a notification can be a follow-up.
- Automatic/AI-assisted moderation of proposals — every proposal is reviewed manually, consistent with the small-team scale of the rest of the admin panel.
- Retiring/deprecating the AI Advisor — it remains as-is, a parallel path for open-ended suggestions rather than a superset of the catalog.
- Migrating `collaborative_events.category` into a proper FK to `event_types` — the catalog's own linkage is fixed here; normalizing `category` itself is a separate, larger concern (touches event creation, not just Actividades).

## Decisions

### 1. Proper join table instead of a text array, backfilled from the current tags

**Decision**:
```sql
CREATE TABLE activity_template_event_types (
  activity_template_id INTEGER NOT NULL REFERENCES activity_templates(id) ON DELETE CASCADE,
  event_type_id INTEGER NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_template_id, event_type_id)
);
```
Backfill: for each `activity_templates` row, for each string in its `event_types` array, `INSERT` a row matching `event_types.name ILIKE` the string; log any string with no match (e.g. old free-text entries not in the current `event_types` table) for manual admin cleanup post-migration. The `event_types TEXT[]` column is kept (not dropped) until the backfill is verified, then dropped in a follow-up migration once confirmed clean.

**Rationale**: Matches the confirmed decision to link to the real table — admins pick from actual event types (a dropdown sourced from `event_types`, same source of truth used elsewhere) instead of maintaining a second hardcoded list that can drift from the real one.

**Alternatives considered**: Adding a single nullable `event_type_id` column instead of a join table — rejected, since an activity like "Photocall" reasonably applies to multiple event types (birthday, wedding, corporate), and the existing `TEXT[]` already models many-to-many.

### 2. Browse UI filters by event category, falls back to unfiltered

**Decision**: `GET .../activities/catalog?eventId=X` joins `activity_template_event_types` → `event_types` and filters where `event_types.name ILIKE collaborative_events.category`. If the event's `category` doesn't match any `event_types.name` (free-text mismatch, per Non-Goals), the endpoint returns the full unfiltered catalog rather than an empty list, with a UI note ("Mostrando todas las actividades" instead of a silently-empty picker).

**Rationale**: Avoids a dead end when `category` and `event_types.name` don't line up exactly (a known, pre-existing data-modeling gap, out of scope to fully fix here) — the feature degrades gracefully instead of hiding the catalog.

### 3. Adding a catalog activity to an event creates a normal `event_activities` row with a source reference

**Decision**: Add a nullable `source_template_id INTEGER REFERENCES activity_templates(id) ON DELETE SET NULL` to `event_activities`. One-click-add from the browse UI sets it; manual/AI-assisted adds leave it null. Also increments `activity_templates.usage_count` (column already exists, currently unused by any write path — confirm at implementation time — this is its first writer).

**Rationale**: Keeps voting/approval/status logic entirely on `event_activities` unchanged (no parallel activity model to reconcile), while making "this came from the catalog" queryable for future analytics (e.g. surfacing popular catalog activities first) without being required by this phase's UI.

### 4. Proposal workflow: new table, references the source event activity, admin approval copies (doesn't move) data

**Decision**:
```sql
CREATE TABLE activity_catalog_proposals (
  id SERIAL PRIMARY KEY,
  event_activity_id INTEGER NOT NULL REFERENCES event_activities(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES collaborative_events(id) ON DELETE CASCADE,
  proposed_by_participant_id INTEGER REFERENCES collaborative_event_participants(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
`title`/`description` are copied at proposal time (snapshot), not read live from `event_activities`, so a later edit/deletion of the original event activity doesn't change what the admin is reviewing. Approval inserts a new `activity_templates` row (admin still assigns `event_types` at approval time via the same form used for manual entries — the proposal doesn't force an event-type guess) and sets `status = 'approved'`; rejection just sets `status = 'rejected'`, row kept for audit.

**Rationale**: Snapshotting avoids the reviewed content silently changing under the admin; requiring the admin to assign event types at approval (rather than inheriting the originating event's category) keeps the catalog's tagging deliberate and admin-controlled, consistent with how catalog entries are created manually today.

### 5. "Proponer para el catálogo" is per-activity, visible to its proposer and the organizer

**Decision**: Button shown on each `event_activities` row in `ActivitiesTab.tsx` to (a) the participant who added it, and (b) the event organizer — not to every participant, to avoid random guests proposing others' ideas. One pending proposal per `event_activity_id` at a time (unique constraint via a partial index `WHERE status = 'pending'`), so re-clicking after a pending proposal exists is a no-op with a toast ("Ya está propuesta").

**Rationale**: Matches the "regular admin task" framing — proposals come from the person who owns the idea, not crowd-submitted duplicates.

## Risks / Trade-offs

- **Backfill accuracy**: string-to-`event_types.name` matching is best-effort (`ILIKE`); any mismatches need one-time manual admin cleanup after migration — flagged, logged, not silently dropped.
- **`category` vs `event_types.name` drift**: the browse filter's graceful fallback (Decision 2) means the "filtered by event type" promise is soft, not guaranteed, until the broader `category`/`event_types` normalization (explicitly out of scope) happens.
- **`usage_count` becomes meaningful for the first time**: no historical data to backfill it with — starts at 0 for all templates going forward from this change, existing "popularity" is unknown and not reconstructable.
