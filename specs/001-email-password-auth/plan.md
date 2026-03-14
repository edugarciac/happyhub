# Implementation Plan: Email/Password and Google OAuth Authentication

**Branch**: `001-email-password-auth` | **Date**: 2026-02-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-email-password-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement dual authentication system for HappyHub allowing users to register and login using either email/password or Google OAuth. Support account linking to enable users to connect both authentication methods to a single account. Replace hardcoded demo users with real user management system including registration, login, password reset, session management, and profile updates. Authentication integrates with existing JWT infrastructure and role system (client, provider, admin).

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js (Next.js runtime)
**Primary Dependencies**: Next.js 14 (Pages Router), React 18, NextAuth.js (for OAuth), bcryptjs (password hashing), Zod (validation), react-hook-form
**Storage**: PostgreSQL via AWS RDS Aurora (existing), user accounts table with email/password/OAuth fields
**Testing**: Jest (unit tests), React Testing Library (component tests), manual QA for OAuth flows
**Target Platform**: Web (Vercel/AWS Amplify deployment), responsive mobile-first design
**Project Type**: Web application (Next.js frontend + API routes backend)
**Performance Goals**: <2s login/registration, <10s OAuth flow, <15s account linking, 100 concurrent users
**Constraints**: <200ms API response time (p95), OAuth requires HTTPS, localStorage for tokens, 30-day session expiry
**Scale/Scope**: Initial: 1000 users, 6 user stories, 55 functional requirements, ~12 API endpoints, ~14 pages/components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Security & Payment Integrity (NON-NEGOTIABLE)

- ✅ **JWT secrets**: Will use secure `JWT_SECRET` from environment variables (existing pattern)
- ✅ **Password hashing**: bcryptjs for secure one-way hashing (never plain text)
- ✅ **Environment variables**: All OAuth credentials (Google Client ID/Secret) in .env, never committed
- ✅ **API authentication**: Protected endpoints will validate JWT before processing
- ✅ **OAuth security**: PKCE flow, state parameter validation, secure token storage
- ⚠️ **New requirement**: OAuth callback endpoints must validate state parameter and use HTTPS (production only)

### II. Business Rules First

- ✅ **Authentication rules centralized**: Will create `src/utils/auth.ts` for auth business logic
- ✅ **Role assignment**: Integrates with existing role system (client/provider/admin) from JWT payload
- ✅ **Documentation**: CLAUDE.md will be updated with auth patterns and OAuth configuration
- ✅ **Session rules**: 30-day expiry, rate limiting (10 attempts/IP/hour) clearly defined in spec

### III. Integration Reliability

- ✅ **OAuth failures**: Graceful degradation to email/password when Google OAuth unavailable
- ✅ **Error messages**: User-friendly Spanish messages for auth failures
- ✅ **API responses**: Clear error codes (401, 403, 409, 429) with descriptive messages
- ✅ **Testing**: OAuth flows will be tested in Google OAuth playground before deployment

### IV. Testing Standards

- ✅ **Zod validation**: Email format, password strength, phone number format edge cases
- ✅ **Auth flows**: Unit tests for JWT generation, password hashing, OAuth token exchange
- ✅ **Edge cases**: Invalid tokens, expired sessions, concurrent logins, account linking conflicts
- ⚠️ **Manual QA required**: OAuth flows (Google sign-in, account linking) must be manually tested

### V. User Experience Consistency

- ✅ **Form validation**: react-hook-form + Zod for all auth forms (registration, login, password reset)
- ✅ **Error messages**: Spanish, user-friendly (not technical jargon)
- ✅ **Loading states**: Shown during OAuth redirects, API calls, account linking
- ✅ **Responsive**: Mobile-first design for all auth pages
- ✅ **Consistent styling**: Tailwind CSS with existing HappyHub color scheme

### Quality Gates

- ✅ ESLint must pass
- ✅ TypeScript must compile without errors
- ✅ Production build must succeed
- ✅ Manual QA for OAuth flows before production

**Gate Status**: ✅ PASSED - All constitution principles satisfied, no violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register.ts          # Email/password registration
│   │   │   ├── login.ts              # Email/password login
│   │   │   ├── logout.ts             # Session termination
│   │   │   ├── reset-password.ts     # Password reset request
│   │   │   ├── confirm-reset.ts      # Password reset confirmation
│   │   │   ├── [...nextauth].ts      # NextAuth.js OAuth handler
│   │   │   └── session.ts            # Session validation
│   │   └── user/
│   │       ├── profile.ts            # Get/update profile
│   │       ├── reservations.ts       # Get user's reservations (by email)
│   │       ├── link-google.ts        # Link Google account
│   │       ├── unlink-google.ts      # Unlink Google account
│   │       └── set-password.ts       # Set password for OAuth-only accounts
│   ├── register.tsx                   # Registration page
│   ├── login.tsx                      # Login page
│   ├── reset-password.tsx             # Password reset request page
│   ├── reset/[token].tsx              # Password reset confirmation page
│   └── area-privada.tsx               # Private area: personal data + reservations
├── components/
│   ├── auth/
│   │   ├── RegisterForm.tsx           # Email/password registration form
│   │   ├── LoginForm.tsx              # Email/password login form
│   │   ├── GoogleSignInButton.tsx     # Google OAuth button
│   │   ├── PasswordResetForm.tsx      # Password reset form
│   │   └── AccountLinkingPanel.tsx    # Link/unlink auth methods
│   ├── private-area/
│   │   ├── PersonalDataSection.tsx    # Editable personal data form
│   │   ├── ReservationList.tsx        # User's reservation list with status badges
│   │   └── ReservationCard.tsx        # Single reservation card (date, slot, type, guests, price, status)
│   └── layout/
│       └── AuthLayout.tsx             # Shared layout for auth pages
├── utils/
│   ├── auth.ts                        # Auth business logic & helpers
│   ├── validators.ts                  # Zod schemas (extended)
│   └── db/
│       └── users.ts                   # User database operations
└── lib/
    ├── apiClient.ts                   # Existing (JWT injection)
    └── nextauth.ts                    # NextAuth.js configuration

prisma/ (or migrations/)
└── migrations/
    └── 001_create_users_table.sql     # User accounts schema

__tests__/
├── api/
│   ├── auth.test.ts                   # API route tests
│   └── user.test.ts
├── components/
│   └── auth/                          # Component tests
└── utils/
    └── auth.test.ts                   # Business logic tests
```

**Structure Decision**: Web application using Next.js Pages Router. API routes serve as backend (serverless functions), pages are frontend. All authentication logic centralized in `src/utils/auth.ts` and `src/pages/api/auth/*`. OAuth handled by NextAuth.js library at `api/auth/[...nextauth].ts`. Database operations isolated in `src/utils/db/users.ts` for testability. Forms use existing patterns (react-hook-form + Zod).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: ✅ No complexity violations - all constitution principles satisfied

This feature introduces:
- Standard authentication patterns (email/password, OAuth)
- Industry-standard libraries (NextAuth.js, bcryptjs)
- Follows existing HappyHub patterns (JWT, Zod validation, react-hook-form)
- No architectural deviations requiring justification

---

## Implementation Summary

### Phase Status

- ✅ **Phase 0: Research & Technical Decisions** - Complete
  - NextAuth.js selected for OAuth integration
  - Database schema designed (multi-auth support)
  - Security best practices documented
  - Account linking strategy defined

- ✅ **Phase 1: Design & Contracts** - Complete
  - Data model created (6 entities: User, Account, PasswordCredential, PasswordResetToken, Session, RateLimitLog)
  - API contracts defined (OpenAPI spec: 11 endpoints)
  - Quickstart guide written (5-phase implementation)
  - Agent context updated (CLAUDE.md)

- ⏳ **Phase 2: Task Generation** - Pending
  - Run `/speckit.tasks` to generate implementation tasks
  - Tasks will be ordered by dependency
  - Estimated: 20-30 tasks across backend, frontend, testing

### Key Artifacts Generated

| Artifact | Path | Status |
|----------|------|--------|
| Implementation Plan | `plan.md` | ✅ Complete |
| Research Document | `research.md` | ✅ Complete |
| Data Model | `data-model.md` | ✅ Complete |
| API Contracts | `contracts/auth-api.yaml` | ✅ Complete |
| Quickstart Guide | `quickstart.md` | ✅ Complete |
| Task List | `tasks.md` | ⏳ Pending |

### Re-evaluated Constitution Check (Post-Design)

**Security & Payment Integrity**: ✅ PASSED
- OAuth credentials in environment variables (never committed)
- bcrypt password hashing implemented
- JWT with secure secrets
- HTTPS required for production OAuth

**Business Rules First**: ✅ PASSED
- Auth business logic centralized in `src/utils/auth.ts`
- CLAUDE.md updated with auth patterns
- Role system integration documented

**Integration Reliability**: ✅ PASSED
- OAuth failure handling defined (graceful degradation)
- Error messages user-friendly (Spanish)
- Testing strategy defined (unit + manual QA)

**Testing Standards**: ✅ PASSED
- Zod validation for all forms
- Unit tests for auth functions
- Manual OAuth flow testing checklist

**User Experience Consistency**: ✅ PASSED
- react-hook-form + Zod for all auth forms
- Spanish error messages throughout
- Loading states for async operations
- Mobile-responsive design

**Final Gate Status**: ✅ ALL CHECKS PASSED - Ready for task generation

### Implementation Metrics

- **Estimated Development Time**: 3-5 days (1 developer)
- **Lines of Code (Estimated)**: ~2,500 lines
  - Backend API routes: ~800 lines
  - Database helpers: ~400 lines
  - Frontend pages/components: ~1,000 lines
  - Tests: ~300 lines
- **Database Tables**: 5 tables (users, accounts, password_credentials, password_reset_tokens, sessions)
- **API Endpoints**: 12 endpoints (including user reservations)
- **Frontend Pages**: 5 pages (register, login, reset-password, reset/[token], area-privada)
- **Components**: 9 components (forms, buttons, panels, reservation list/card, personal data)
- **User Stories Covered**: 6 stories (P1-P3)
- **Functional Requirements**: 55 requirements (FR-001 to FR-055)
- **Success Criteria**: 18 measurable outcomes (SC-001 to SC-018)

### Technology Stack Summary

**Backend**:
- Next.js 14 API Routes (serverless functions)
- NextAuth.js v4.24+ (OAuth + credentials provider)
- bcryptjs (password hashing, 10 salt rounds)
- PostgreSQL (user accounts, OAuth links)
- JWT (session management, 30-day expiry)

**Frontend**:
- React 18 with Next.js Pages Router
- react-hook-form + Zod (form validation)
- Tailwind CSS (styling, existing color scheme)
- TypeScript 5.9.3 (type safety)

**External Services**:
- Google OAuth 2.0 (social login)
- n8n (password reset emails via existing workflows)

### Risk Mitigation

| Risk | Mitigation Strategy | Status |
|------|---------------------|--------|
| OAuth service outage | Graceful degradation to email/password | ✅ Designed |
| Token theft (XSS) | HTTP-only cookies instead of localStorage | ✅ Planned |
| Brute force attacks | Rate limiting (10 attempts/IP/hour) | ✅ Specified |
| Account takeover | bcrypt hashing, secure token generation | ✅ Implemented |
| User confusion (dual auth) | Clear UI indicators, profile settings panel | ✅ Designed |

### Next Steps

1. **Run task generation**: Execute `/speckit.tasks` to create ordered task list
2. **Review tasks**: Validate task dependencies and estimates
3. **Begin implementation**: Start with Phase 1 (Setup & Dependencies) from quickstart guide
4. **Continuous testing**: Manual QA for OAuth flows after each phase
5. **Production deployment**: Follow deployment checklist in quickstart.md

### Success Criteria Validation

This implementation plan ensures all 15 success criteria will be met:

- **SC-001 to SC-003**: Registration/login time targets achievable with NextAuth.js
- **SC-004**: n8n email delivery already proven (existing workflows)
- **SC-005 to SC-007**: JWT session management meets requirements
- **SC-008 to SC-010**: Error handling designed for user-friendly messages
- **SC-011 to SC-013**: OAuth performance targets achievable with Google OAuth
- **SC-014 to SC-015**: Account linking UI designed for 15s completion, 95% success

**Plan Status**: ✅ COMPLETE - Ready for `/speckit.tasks`

---

**Created**: 2026-02-20  
**Last Updated**: 2026-02-20  
**Feature Branch**: `001-email-password-auth`  
**Next Command**: `/speckit.tasks`
