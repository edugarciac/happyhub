<!--
Sync Impact Report:
- Version change: [CONSTITUTION_VERSION] → 1.0.0
- Initial constitution creation for HappyHub
- Principles defined: 5 core principles
- Templates requiring updates: ⚠ All templates (.specify/templates/) pending alignment
- Follow-up: Align plan, spec, and tasks templates with constitution principles
-->

# HappyHub Constitution

## Core Principles

### I. Security & Payment Integrity (NON-NEGOTIABLE)

**Rules:**
- Stripe webhook signature verification MUST be enforced (never skip `STRIPE_WEBHOOK_SECRET` validation)
- JWT tokens MUST use secure secrets, never hardcoded values
- Environment variables containing credentials MUST never be committed (.env files in .gitignore)
- API endpoints handling sensitive data MUST validate authentication before processing
- Raw body parsing MUST be used for webhook endpoints (`bodyParser: false`)

**Rationale:** HappyHub handles real payments and user data. Security breaches damage trust and business viability. Payment integrity ensures accurate booking confirmations and prevents fraud.

### II. Business Rules First

**Rules:**
- Pricing logic MUST be centralized in `src/utils/pricing.ts`
- Business rules (time slots, holidays, pricing tiers) MUST be defined before implementation
- Changes to pricing/availability MUST update both code and documentation (CLAUDE.md)
- Holiday calendars MUST be reviewed annually (update `holidays2025` array)
- All business logic changes MUST be validated against CLAUDE.md business rules section

**Rationale:** Business rules drive revenue and customer satisfaction. Centralization prevents inconsistencies. Documentation ensures team alignment and reduces errors.

### III. Integration Reliability

**Rules:**
- External integrations (n8n, Stripe, Google Calendar) MUST handle failures gracefully
- Webhook endpoints MUST validate payload structure before processing
- API responses MUST include clear error messages for debugging
- n8n workflow changes MUST be tested with `n8n/test-webhook.sh` before deployment
- Availability conflicts (409 errors) MUST return user-friendly messages

**Rationale:** HappyHub depends on n8n for core workflows. Integration failures cascade to poor UX. Graceful degradation maintains service quality during partial outages.

### IV. Testing Standards

**Rules:**
- Form validation schemas (Zod) MUST be tested for edge cases (invalid dates, malformed phone numbers)
- Payment flows MUST be tested in Stripe test mode before production deployment
- Webhook signature validation MUST be tested with invalid signatures
- Calendar availability logic MUST be tested for edge cases (midnight boundaries, DST transitions)
- E2E tests MUST cover complete booking flow (form → webhook → payment → confirmation)

**Rationale:** Booking platform failures directly impact revenue. Payment bugs can cause financial loss. Testing prevents costly production incidents.

### V. User Experience Consistency

**Rules:**
- All forms MUST use react-hook-form + Zod for consistent validation UX
- Error messages MUST be user-friendly in Spanish (not technical jargon)
- Loading states MUST be shown during async operations (payment processing, availability checks)
- Pricing MUST be displayed before user commits (no hidden costs)
- Responsive design MUST work on mobile (primary booking device)

**Rationale:** Booking platforms compete on UX. Consistent validation reduces user frustration. Transparent pricing builds trust. Mobile-first aligns with user behavior.

## Development Workflow

### Code Review Requirements

- All changes to business logic (pricing, time slots) MUST be reviewed against CLAUDE.md
- Security-sensitive code (auth, webhooks, payments) MUST be reviewed by senior developer
- Environment variable additions MUST be documented in `.env.example` and CLAUDE.md
- Breaking changes to API contracts MUST include migration plan

### Quality Gates

- ESLint MUST pass before commit (`npm run lint`)
- TypeScript MUST compile without errors (`npm run type-check`)
- Production build MUST succeed (`npm run build`)
- Critical flows (booking, payment) MUST have manual QA before release

## Technology Stack

### Required Stack

- **Framework**: Next.js 14 (Pages Router) - no App Router migrations without constitutional amendment
- **Styling**: Tailwind CSS - maintain custom color scheme (primary: teal/cyan, ocean: blue)
- **Forms**: react-hook-form + Zod - mandatory for all form validation
- **Auth**: JWT (localStorage) - no session-based auth without amendment
- **Payments**: Stripe - Payment Intents and Checkout Sessions only

### External Dependencies

- **n8n**: Workflow automation (calendar, email, Airtable)
- **Google Calendar**: Availability management
- **Airtable**: Data storage (backup/sync)
- **Stripe**: Payment processing

### Dependency Updates

- Security patches: Apply immediately
- Minor updates: Review changelog, test payment flows before applying
- Major updates: Requires constitutional amendment if breaking changes affect architecture

## Governance

### Constitution Authority

- This constitution supersedes conflicting practices or undocumented conventions
- All code reviews MUST verify compliance with these principles
- Non-compliance MUST be justified in PR description or rejected

### Amendment Process

1. Propose amendment with rationale and impact analysis
2. Update affected templates (`.specify/templates/*`)
3. Version bump according to semantic versioning (see below)
4. Document in git commit message
5. Update CLAUDE.md if business rules affected

### Versioning Policy

- **MAJOR**: Remove/redefine core principles, change tech stack requirements
- **MINOR**: Add new principles, expand governance rules
- **PATCH**: Clarifications, typo fixes, non-semantic refinements

### Compliance Review

- During PR review: Verify no principle violations
- During sprint planning: Ensure tasks align with business rules (Principle II)
- During releases: Verify all quality gates passed (Testing Standards)

**Version**: 1.0.0 | **Ratified**: 2026-02-19 | **Last Amended**: 2026-02-19
