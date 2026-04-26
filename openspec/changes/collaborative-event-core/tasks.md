# Tasks: collaborative-event-core

## Status legend
- [ ] pending
- [x] done

---

## Phase 1 – OpenSpec
- [x] proposal.md
- [x] design.md
- [x] tasks.md

## Phase 2 – Data layer
- [x] `src/utils/db/collaborative-events.ts` – CRUD functions
- [x] DB schema auto-migration en `src/lib/db.ts` (ensureCollaborativeEventsSchema)

## Phase 3 – API
- [x] `POST /api/events/collaborative`
- [x] `GET /api/events/collaborative/[id]`
- [x] `PATCH /api/events/collaborative/[id]`
- [x] `POST /api/events/collaborative/join/[inviteCode]`
- [x] `GET/PATCH /api/events/collaborative/[id]/participants/[pid]`
- [x] `GET/POST /api/events/collaborative/[id]/timeline`
- [x] `PATCH/DELETE /api/events/collaborative/[id]/timeline/[tid]`

## Phase 4 – UI
- [x] `/eventos/crear` – formulario crear evento
- [x] `/eventos/[id]` – dashboard con tabs (Info, Participantes, Timeline)
- [x] `/eventos/unirse/[inviteCode]` – página unirse
- [x] Sección "Mis eventos" en `/area-privada`

## Phase 5 – Components
- [x] `EventForm.tsx`
- [x] `EventDashboard.tsx`
- [x] `ParticipantList.tsx`
- [x] `TimelineEditor.tsx`
- [x] `InviteShareCard.tsx`
- [x] `EventCategoryPicker.tsx`
