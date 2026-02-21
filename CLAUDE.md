# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HappyHub is a Next.js event space rental platform for managing and booking celebration venues (birthdays, communions, baptisms, etc.). The platform integrates with n8n for workflow automation, Stripe for payments, and includes a multi-role system (clients, providers, admin).

## Business Rules - Horarios y Tarifas

### Franjas Horarias Disponibles

**Mañanas** (11:00 - 14:30h)
- Apertura: 11:00h
- Cierre: 14:30h
- Sin coste adicional por apertura anticipada a las 10:00h

**Tardes** (16:30 - 20:30h)
- Apertura: 16:30h
- Cierre: 20:30h
- Sin coste adicional por apertura anticipada a las 15:30h

**Noches** (22:00 - 2:00h)
- Apertura: 22:00h
- Cierre: 2:00h (madrugada)
- Sin coste adicional por apertura anticipada a las 21:30h

### Tarifas Oficiales (Alquiler del Espacio)

**De lunes a viernes - Mañanas:** 110€
**De lunes a jueves - Tardes:** 110€
**Viernes y Vísperas de festivos - Tardes:** 155€
**Sábados, domingos y festivos - Mañanas:** 145€
**Sábados, domingos y festivos - Tardes:** 185€
**Nocturno:** A consultar (precio variable)

### Reglas de Negocio para Tarifas

1. **Días laborables (L-J):**
   - Mañana: 110€
   - Tarde: 110€

2. **Viernes:**
   - Mañana: 110€
   - Tarde: 155€ (víspera de festivo)

3. **Fines de semana (Sá-Do) y festivos:**
   - Mañana: 145€
   - Tarde: 185€

4. **Vísperas de festivos:**
   - Aplica tarifa de 155€ en tarde (igual que viernes)

5. **Horario nocturno:**
   - Precio a consultar
   - Requiere validación manual del equipo

### Notas Importantes
- Los precios NO incluyen servicios extras (catering, decoración, animación, etc.)
- Las reservas requieren depósito del 30% para confirmar
- Cancelación gratuita hasta 15 días antes del evento

## Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server on localhost:3000

# Building and deployment
npm run build            # Build for production
npm run start            # Start production server
npm run export           # Export static site

# Code quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler without emitting files
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14 (Pages Router, not App Router)
- **Styling**: Tailwind CSS with custom color scheme (primary: red-orange, secondary: blue)
- **Form handling**: react-hook-form + Zod validation
- **Authentication**: JWT-based (stored in localStorage), demo users hardcoded in `/api/auth`
- **Payments**: Stripe (Payment Intents and Checkout Sessions)
- **Automation**: n8n workflows via webhooks
- **Calendar**: react-calendar component

### Key Integration Points

**n8n Workflow** (`/api/webhook-reserva`)
- Receives reservation data from frontend
- Forwards to n8n webhook (configured via `N8N_WEBHOOK_URL`)
- n8n handles: Google Calendar creation, Airtable storage, Claude AI message generation, email confirmation, Stripe payment link creation
- Returns reservation ID to frontend

**Stripe Webhooks** (`/api/stripe-webhook`)
- Listens for: `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`
- Validates webhook signatures using `STRIPE_WEBHOOK_SECRET`
- Notifies n8n of payment events with reservation context
- Uses raw body parsing (`bodyParser: false`) - critical for signature verification

**API Client** (`src/lib/apiClient.ts`)
- Centralized axios wrapper with JWT token injection
- Automatically redirects to `/login` on 401 errors
- Includes `sendToN8n()` helper for direct n8n communication

### Authentication Flow
- Demo users in `src/pages/api/auth.ts` (admin@happyhub.es, proveedor@happyhub.es)
- JWT tokens stored in localStorage, automatically attached to API requests
- Token verification endpoint: `GET /api/auth`
- Passwords hashed with bcryptjs

### Pages Structure
- `/` - Home with hero and overview
- `/servicios` - Services catalog (catering, animation, decoration, etc.)
- `/disponibilidad` - Interactive calendar for checking availability
- `/reservas` - Main reservation form with success state
- `/mi-reserva/[id]` - Individual reservation view
- `/proveedores` - Provider dashboard for service requests
- `/admin` - Admin dashboard with stats and management
- `/contacto` - Contact form

### Environment Variables
Required in `.env`:
```
N8N_WEBHOOK_URL=           # n8n instance webhook endpoint
STRIPE_SECRET_KEY=          # Stripe API secret key
STRIPE_WEBHOOK_SECRET=      # Stripe webhook signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe public key (client-side)
NEXTAUTH_URL=               # App URL (localhost:3000 or production)
NEXTAUTH_SECRET=            # NextAuth secret
JWT_SECRET=                 # JWT signing secret
CLAUDE_API_KEY=             # Optional: Claude API for n8n
```

## Important Development Notes

### Stripe Webhook Configuration
- The `/api/stripe-webhook` endpoint uses `buffer` from `micro` package
- Must disable Next.js body parser: `export const config = { api: { bodyParser: false } }`
- Webhook signature verification is critical for security
- In Stripe dashboard, configure webhook to point to: `https://[domain]/api/stripe-webhook`

### n8n Workflow Dependencies
- **Primary workflow**: `n8n/n8n-nodes/n8n-reserva-con-validacion.json` (with availability validation)
- **Legacy workflow**: `n8n/n8n-nodes/n8n-nodes.json` (without validation, kept for reference)
- Workflow expects specific data structure with fields: nombre, email, telefono, fecha, hora, pax, extras, tipoEvento
- **Availability validation**: Checks Google Calendar for conflicts before creating reservation
- Returns 409 error with message "Lo siento, la fecha y hora indicada ya está reservada." if conflict detected
- Update Airtable base/table IDs in workflow before deployment
- Claude AI integration in workflow requires Anthropic API key configured in n8n
- Full setup guide in `n8n/INICIO_RAPIDO.md` (10-minute setup)
- Detailed configuration in `n8n/INSTRUCCIONES_CONFIGURACION.md`
- URL configuration without Enterprise plan in `n8n/CONFIGURACION_URL.md`

### Form Validation
- All forms use Zod schemas defined in `src/utils/validators.ts`
- react-hook-form with @hookform/resolvers for validation integration
- Custom formatters in `src/utils/formatters.ts` for dates, prices, and phone numbers

### Multi-Role System
- Client role: Book events, view own reservations
- Provider role: View service requests, manage calendar
- Admin role: Full dashboard access, all reservations, reports
- Role determined by JWT payload `role` field

### Pricing System
- **Pricing logic** in `src/utils/pricing.ts` - centralized pricing calculations
- Uses `calculateBasePrice(date, timeSlot)` to determine prices dynamically
- Holiday detection includes Spanish holidays 2025 (update array for 2026+)
- Three time slots: morning, afternoon, night (night requires manual consultation)
- Always use `getAvailableTimeSlotsWithPricing(date)` to get slots with current pricing

### Styling Conventions
- Custom Tailwind utilities: `container-custom`, `btn-primary`, `btn-outline`, `card`
- Color palette: primary (teal/cyan), ocean (blue), accent (cyan) - defined in tailwind.config.js
- Manrope font family via CSS variables
- Custom animations: fade-in, slide-up, slide-down, scale-in, float
- Responsive breakpoints: default mobile-first approach

### Payment Flow
1. User fills reservation form
2. Form sends to `/api/webhook-reserva`
3. n8n creates calendar event, stores data, generates payment link
4. Frontend receives reservation ID and shows success screen
5. User receives email with payment link
6. On payment, Stripe webhook notifies n8n
7. n8n sends confirmation notifications

## Key Files and Their Purpose

### Utilities
- `src/utils/pricing.ts` - **Critical**: Centralized pricing logic, holiday detection, time slot management
  - `calculateBasePrice(date, timeSlot)` - Returns price or 'consult' for night slots
  - `getAvailableTimeSlotsWithPricing(date)` - Gets all slots with calculated prices
  - `isWeekend()`, `isHoliday()`, `isHolidayEve()`, `isFriday()` - Date helpers
  - Update `holidays2025` array when year changes

- `src/utils/validators.ts` - Zod schemas for form validation
- `src/utils/formatters.ts` - Date, price, phone number formatters

### API Routes
- `src/pages/api/webhook-reserva.ts` - Forwards reservations to n8n, returns reservation ID
- `src/pages/api/stripe-webhook.ts` - **Critical**: Uses raw body parsing, signature verification required
- `src/pages/api/auth.ts` - JWT authentication, demo users with bcrypt hashed passwords

### Components
- `src/components/Calendar.tsx` - react-calendar wrapper with booking date logic
- `src/components/ReservationForm.tsx` - Main booking form with validation
- `src/components/Header.tsx`, `Footer.tsx` - Global layout components
- `src/components/Hero.tsx` - Homepage hero section
- `src/components/ProviderCard.tsx` - Provider service card display

### Pages
- `src/pages/disponibilidad.tsx` - **Recently updated**: Dynamic pricing calendar with time slot selection
  - Uses `getAvailableTimeSlotsWithPricing()` for real-time price calculation
  - Shows different prices for weekdays/weekends/holidays
  - Larger calendar display (scale 110% mobile, 125% desktop)

## Testing the Application

### Local Development Setup
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure all variables
3. Ensure n8n instance is running and webhook URL is accessible
4. Configure Stripe webhook to use a tool like ngrok for local testing: `ngrok http 3000`
5. Start dev server: `npm run dev`

### n8n Testing
- Use `n8n/test-webhook.sh` - Interactive script for testing n8n webhook
- Use `n8n/test-examples.json` - Sample payloads for different scenarios
- Test availability validation by booking same date/time twice (should return 409)

### Demo Credentials
- Admin: admin@happyhub.es (password in bcrypt hash in auth.ts)
- Provider: proveedor@happyhub.es (password in bcrypt hash in auth.ts)

### Common Issues
- "N8N_WEBHOOK_URL no está configurada": Check environment variable in `.env` or Vercel settings
- "Invalid signature" from Stripe: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- "Lo siento, la fecha y hora indicada ya está reservada": Expected behavior when date/time conflict detected
- Calendar not showing blocked dates: Query Google Calendar via n8n or implement database query
- 401 errors: Token expired or invalid, check localStorage and JWT_SECRET
- Pricing showing wrong amounts: Check `holidays2025` array is up to date in `src/utils/pricing.ts`

## Project Memory System

This project maintains institutional knowledge in `docs/project_notes/` for consistency across sessions and to support better decision-making.

### Memory Files

- **bugs.md** - Bug log with dates, solutions, and prevention notes
- **decisions.md** - Architectural Decision Records (ADRs) with context and trade-offs
- **key_facts.md** - Project configuration, credentials, ports, important URLs
- **issues.md** - Work log with ticket IDs, descriptions, and URLs

### Memory-Aware Protocols

**Before proposing architectural changes:**
- Check `docs/project_notes/decisions.md` for existing decisions
- Verify the proposed approach doesn't conflict with past choices
- If it does conflict, acknowledge the existing decision and explain why a change is warranted

**When encountering errors or bugs:**
- Search `docs/project_notes/bugs.md` for similar issues
- Apply known solutions if found
- Document new bugs and solutions when resolved

**When looking up project configuration:**
- Check `docs/project_notes/key_facts.md` for credentials, ports, URLs, service accounts
- Prefer documented facts over assumptions
- Verify environment variable names and business rules

**When completing work on tickets:**
- Log completed work in `docs/project_notes/issues.md`
- Include date, brief description, and relevant file paths
- Reference git commit hashes for traceability

**When user requests memory updates:**
- Update the appropriate memory file (bugs, decisions, key_facts, or issues)
- Follow the established format and style (bullet lists, dates, concise entries)
- Ask clarifying questions if needed to properly categorize the information

### Style Guidelines for Memory Files

- **Prefer bullet lists over tables** for simplicity and ease of editing
- **Keep entries concise** (1-3 lines for descriptions)
- **Always include dates** for temporal context
- **Include URLs** for tickets, documentation, monitoring dashboards
- **Manual cleanup** of old entries is expected (not automated)

### Using Memory for Decision-Making

When facing technical decisions:

1. **Research existing decisions** - Check `decisions.md` to understand past architectural choices
2. **Review known issues** - Check `bugs.md` to avoid repeating past mistakes
3. **Verify configuration** - Use `key_facts.md` as source of truth for setup details
4. **Document new decisions** - Add ADR entries when making significant choices
5. **Learn from history** - Use `issues.md` to understand what worked (and what didn't)

**Example Decision-Making Flow:**
```
User: "Should we migrate from localStorage to cookies for JWT?"
→ Check decisions.md for ADR-002 (JWT in localStorage)
→ Review context and trade-offs already considered
→ If proposing change, acknowledge existing decision and explain why revisiting
→ Document new decision as ADR-006 if change is approved
```

## Active Technologies
- TypeScript 5.9.3, Node.js (Next.js runtime) + Next.js 14 (Pages Router), React 18, NextAuth.js (for OAuth), bcryptjs (password hashing), Zod (validation), react-hook-form (001-email-password-auth)
- PostgreSQL via AWS RDS Aurora (existing), user accounts table with email/password/OAuth fields (001-email-password-auth)

## Recent Changes
- 001-email-password-auth: Added TypeScript 5.9.3, Node.js (Next.js runtime) + Next.js 14 (Pages Router), React 18, NextAuth.js (for OAuth), bcryptjs (password hashing), Zod (validation), react-hook-form
