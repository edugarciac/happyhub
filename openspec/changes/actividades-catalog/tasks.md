# Tasks: actividades-catalog

## T1 — Database
- [ ] Create `activity_template_event_types` join table migration
- [ ] Backfill from existing `activity_templates.event_types` TEXT[] (log unmatched strings)
- [ ] Add `source_template_id` to `event_activities`
- [ ] Create `activity_catalog_proposals` table + partial unique index on `(event_activity_id) WHERE status='pending'`
- [ ] Run migrations against Neon DB
- [ ] Confirm `event_types` table columns/admin endpoint used to populate the multi-select

## T2 — Admin: rename & re-link catalog page
- [ ] Rename `/admin/activity-templates` → `/admin/actividades-catalogo` (route + nav label)
- [ ] Replace hardcoded `EVENT_TYPE_OPTIONS` with real `event_types` multi-select
- [ ] Update `POST/PUT /api/admin/activity-templates` to write `activity_template_event_types`
- [ ] Update `GET /api/admin/activity-templates` to resolve/return event types

## T3 — Admin: proposal review queue
- [ ] `GET /api/admin/actividades-catalogo/proposals`
- [ ] `POST /api/admin/actividades-catalogo/proposals/[id]/approve`
- [ ] `POST /api/admin/actividades-catalogo/proposals/[id]/reject`
- [ ] "Propuestas pendientes" section in the admin page, with badge count

## T4 — Participant: browse & add from catalog
- [ ] `GET /api/events/collaborative/[id]/entertainment/activities/catalog`
- [ ] `POST /api/events/collaborative/[id]/entertainment/activities/from-catalog/[templateId]`
- [ ] Browse UI in `ActivitiesTab.tsx` (grid, filter note, add button)

## T5 — Participant: propose to catalog
- [ ] `POST /api/events/collaborative/[id]/entertainment/activities/[activityId]/propose-catalog`
- [ ] Include `hasPendingProposal` in the existing activities list response
- [ ] "Proponer para el catálogo" button + state in `ActivitiesTab.tsx`

## Verification
- [ ] Admin renames/relabels catalog page, existing templates still visible with correctly-migrated event types
- [ ] Admin adds a new catalog entry with real event-type multi-select
- [ ] Participant opens Actividades → sees catalog filtered by event category (or fallback note if no match) → adds one with one click
- [ ] Participant proposes a custom activity → appears in admin's pending queue
- [ ] Admin approves → new catalog entry appears, tagged with the event types chosen at approval
- [ ] Admin rejects → proposal marked rejected, original event activity untouched
- [ ] Re-proposing an already-pending activity is blocked with a clear message
- [ ] AI Advisor flow still works unchanged end-to-end
