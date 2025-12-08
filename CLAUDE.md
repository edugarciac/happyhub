# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HappyHub is a Next.js event space rental platform for managing and booking celebration venues (birthdays, communions, baptisms, etc.). The platform integrates with n8n for workflow automation, Stripe for payments, and includes a multi-role system (clients, providers, admin).

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
- The n8n workflow JSON is in `n8n/n8n-nodes/n8n-nodes.json`
- Workflow expects specific data structure with fields: nombre, email, telefono, fecha, hora, pax, extras, tipoEvento
- Update Airtable base/table IDs in workflow before deployment
- Claude AI integration in workflow requires Anthropic API key configured in n8n

### Form Validation
- All forms use Zod schemas defined in `src/utils/validators.ts`
- react-hook-form with @hookform/resolvers for validation integration
- Custom formatters in `src/utils/formatters.ts` for dates, prices, and phone numbers

### Multi-Role System
- Client role: Book events, view own reservations
- Provider role: View service requests, manage calendar
- Admin role: Full dashboard access, all reservations, reports
- Role determined by JWT payload `role` field

### Styling Conventions
- Custom Tailwind utilities: `container-custom`, `btn-primary`, `btn-outline`, `card`
- Color palette: primary (red-orange shades), secondary (blue shades)
- Inter font family via CSS variables
- Responsive breakpoints: default mobile-first approach

### Payment Flow
1. User fills reservation form
2. Form sends to `/api/webhook-reserva`
3. n8n creates calendar event, stores data, generates payment link
4. Frontend receives reservation ID and shows success screen
5. User receives email with payment link
6. On payment, Stripe webhook notifies n8n
7. n8n sends confirmation notifications

## Testing the Application

### Local Development Setup
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure all variables
3. Ensure n8n instance is running and webhook URL is accessible
4. Configure Stripe webhook to use a tool like ngrok for local testing: `ngrok http 3000`
5. Start dev server: `npm run dev`

### Demo Credentials
- Admin: admin@happyhub.es (password in bcrypt hash in auth.ts)
- Provider: proveedor@happyhub.es (password in bcrypt hash in auth.ts)

### Common Issues
- "N8N_WEBHOOK_URL no está configurada": Check environment variable in `.env` or Vercel settings
- "Invalid signature" from Stripe: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Calendar not showing blocked dates: Implement database query logic in Calendar component
- 401 errors: Token expired or invalid, check localStorage and JWT_SECRET
