## Why

Actividades (`ActivitiesTab.tsx`) already lets participants add and toggle-vote on activities, and admins already maintain a knowledge base at `/admin/activity-templates` (`title`, `description`, `event_types` tag array, `participant_types`, `tags`) — but it's only ever consumed as grounding data for an AI "Advisor" modal (`ActivityAdvisor.tsx` → `POST .../entertainment/activities/suggest`). Users can never browse and pick directly from the catalog, there's no workflow for promoting a user-added activity into it, and its `event_types` field is a hardcoded frontend string array (`EVENT_TYPE_OPTIONS` in `admin/activity-templates.tsx`), not linked to the real `event_types` table that already drives event-type selection elsewhere (bookings).

This proposal turns that existing admin page into "Catálogo de actividades," adds a direct browse/pick UI in the Actividades tab alongside the existing AI advisor, links the catalog properly to `event_types`, and adds the propose → admin-review → publish workflow for user-submitted activities.

## What Changes

- Rename/extend `/admin/activity-templates` → `/admin/actividades-catalogo` ("Catálogo de actividades"): existing CRUD stays, plus a new "Propuestas pendientes" view for admin review
- Replace the hardcoded `EVENT_TYPE_OPTIONS` array with a real multi-select sourced from the `event_types` table (`activity_templates.event_types TEXT[]` → a proper join table `activity_template_event_types(activity_template_id, event_type_id)`)
- Add a direct browse/pick UI to `ActivitiesTab.tsx`: a filterable list of catalog activities (filtered by the event's `category` when it matches a known `event_types.name`), one click adds the catalog activity to the event's `event_activities` — the existing AI Advisor stays as a secondary "no sé qué elegir" option, unchanged
- User-added custom activities (freeform or AI-assisted, both existing paths) gain a "Proponer para el catálogo" action, visible to the organizer/proposer, that creates a pending catalog proposal referencing the source activity
- New admin review queue: approve (copies the proposal into `activity_templates`, linked to the proposer for attribution) or reject (marks the proposal rejected; no notification to the proposer in this phase — see Non-Goals in design)

## Capabilities

### New Capabilities
- `activity-catalog-browse`: participants browse and one-click-add catalog activities inside an event, filtered by event type
- `activity-catalog-proposal`: participants propose a custom event activity for inclusion in the shared catalog
- `activity-catalog-review`: admin approves/rejects pending proposals into the catalog

### Modified Capabilities
- `activity-catalog-admin-crud` (was "activity templates admin"): renamed/relabeled page, proper `event_types` linkage instead of hardcoded tags

## Impact

- **Database**: new `activity_template_event_types` join table + migration to backfill it from the existing `event_types TEXT[]` column (best-effort name match against `event_types.name`, logged for manual review of any that don't match); new `activity_catalog_proposals` table (source activity data, `event_id`, `proposed_by_participant_id`, `status`, `reviewed_by`, `reviewed_at`)
- **API routes**: admin — extend `activity-templates.ts`/`[id].ts` for the new join table, add `GET /api/admin/actividades-catalogo/proposals`, `POST .../proposals/[id]/approve`, `POST .../proposals/[id]/reject`; participant-facing — `GET /api/events/collaborative/[id]/entertainment/activities/catalog` (browse, filtered), `POST .../activities/[activityId]/propose-catalog`
- **Frontend**: rename admin page + nav entry to "Catálogo de actividades"; `ActivitiesTab.tsx` gains the browse/pick UI and the "Proponer para el catálogo" action
- **No change** to existing voting (`event_activity_votes`) or the AI Advisor flow — both continue to work exactly as today
