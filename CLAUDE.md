# Project: happyhub
HappyHub platform - private events venue + booking platform.

## Owner
Edu Garcia Casas

## Status
Active

## Key Files
- `docs/project_notes/decisions.md` - Architectural Decision Records (ADRs)
- `src/utils/pricing.ts` - Centralized pricing logic
- `src/pages/api/` - API routes for authentication and webhooks
- `n8n/n8n-nodes/` - n8n workflow JSONs (legacy, n8n is no longer used)

## Tech Stack
- Next.js 14 (Pages Router), React 18, TypeScript, Tailwind CSS
- Neon Postgres (serverless) - NOT Supabase
- Stripe (payments), Resend (email)
- Calendar: private iCalendar feed `/api/calendar/<token>.ics` generated from the DB (Google Calendar API sync and n8n are no longer used)
- WhatsApp Cloud API (notifications)

## Deployment
**Vercel** (migrated from AWS Amplify March 2026)
- Push to `main` triggers automatic deployment
- Environment variables managed in Vercel Console
- DNS on AWS Route 53, pointing to Vercel
- `amplify.yml` exists for historical reference only

## Development workflow
- **OpenSpec first**: All implementations MUST be documented in `openspec/` before writing any code. Create proposal.md, design.md, specs, and tasks before implementing. No exceptions.
- OpenSpec structure: `openspec/changes/<change-name>/` with `.openspec.yaml`, `proposal.md`, `design.md`, `specs/`, `tasks.md`
- Product vision: `openspec/openspec-plataforma-eventos.md`
- **Guides always in sync**: every change that modifies the behaviour or usability of the website or of Home Assistant (code, `home-assistant/` panel/scripts/sensors, rules, prices, flows, texts the user sees) MUST update, in the same commit/PR, both guides. No exceptions.
  - **User guide (public)**: `content/kb/` → `/guia-sala`, `/como-funciona`, the tablet's **Ayuda** button and the customer chatbot. Format: `content/kb/README.md`.
  - **Internal guide (private)**: `content/interno/` → only `/admin/manual` for admins. Format: `content/interno/README.md`.
  - **Never show internal content to end users**: internal details (HA entities/scripts, `/admin/` routes, business processes) go ONLY in `content/interno/`. The build fails if `content/kb/` contains any `INTERNAL_MARKERS` (`src/lib/kb.ts`) or if an internal doc declares `pages`. Never weaken these checks to make a build pass.
  - **Structure by topic**: `hub` (topic, mandatory one-line `summary`) → `detalle` (explanations) and `operacion` (in `operaciones/`) nested with `parent`. Link sub-pages from the hub. Use the hubs' `summary` to locate docs quickly when answering questions or learning the business logic.
  - Add the guide updates as a task in the OpenSpec `tasks.md`, and before finishing grep both folders for old texts/names to leave nothing stale.
