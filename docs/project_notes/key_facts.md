# Key Facts

**⚠️ SECURITY:** This file contains non-sensitive configuration only. Never store passwords, API keys, or secrets here.

## Environment Configuration

**Required Environment Variables:**
- `N8N_WEBHOOK_URL` - n8n instance webhook endpoint
- `STRIPE_SECRET_KEY` - Stripe API secret key (in `.env`, not in git!)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (in `.env`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key (safe for client)
- `JWT_SECRET` - JWT signing secret (in `.env`)
- `NEXTAUTH_URL` - App URL (localhost:3000 or production)
- `NEXTAUTH_SECRET` - NextAuth secret (in `.env`)
- `CLAUDE_API_KEY` - Optional: Claude API for n8n (in `.env`)

**Environment Files:**
- `.env` - Local secrets (gitignored)
- `.env.example` - Template with variable names only

## Business Rules

### Event Time Slots

**Morning (Mañanas):**
- Hours: 11:00 - 14:30h
- Free early opening at 10:00h
- Price range: 110€ - 130€ depending on day

**Afternoon (Tardes):**
- Hours: 16:30 - 20:30h
- Free early opening at 15:30h
- Price range: 110€ - 170€ depending on day

**Night (Nocturno):**
- Hours: 22:00 - 2:00h (next day)
- Free early opening at 21:30h
- Price: "Consult" (variable, requires manual quote)

### Pricing Rules (Actual - 2025)

**Weekdays (Mon-Fri Morning):**
- Morning: 110€

**Weekdays (Mon-Thu Afternoon):**
- Afternoon: 110€

**Friday & Holiday Eves (Afternoon):**
- Afternoon: 155€

**Weekends (Sat-Sun) & Holidays:**
- Morning: 145€
- Afternoon: 185€

**Source of Truth:** `src/utils/pricing.ts`
- Function: `calculateBasePrice(date, timeSlot)`
- Holiday array: `holidays2025` (update annually!)

### Booking Rules

- Deposit: 30% required to confirm reservation
- Cancellation: Free up to 15 days before event
- Prices: Space rental only, extras (catering, decoration) not included

## API Endpoints

### Internal API Routes (Next.js)

**Authentication:**
- `POST /api/auth` - Login with email/password, returns JWT
- `GET /api/auth` - Verify current JWT token

**Reservations:**
- `POST /api/webhook-reserva` - Forward reservation to n8n
- `POST /api/stripe-webhook` - Handle Stripe payment events (raw body required!)
- `GET /api/google-calendar-slots` - Get available time slots from Google Calendar

### External Services

**n8n Workflow (PRODUCTION - Nueva Instancia Robusta):**
- URL: http://52.208.80.224:5678
- Webhook: http://52.208.80.224:5678/webhook/reservation-request
- Usuario: admin
- Contraseña: ChangeThisPassword123! (CAMBIAR EN PRIMER LOGIN)
- EC2 Instance: i-0b869fcbf14768c25 (t3.small, 2GB RAM, 30GB gp3)
- Region: eu-west-1 (Ireland)
- Deployed: 2026-02-24
- Database: PostgreSQL persistente
- Backups: Automáticos semanales domingos 2 AM → S3 (happyhub-n8n-backups)
- Purpose: Orchestrate Google Calendar, WhatsApp Business, Neon DB, Email, Stripe payment links
- Workflow file: `n8n/n8n-nodes/n8n-reserva-neon-whatsapp.json`
- Documentation: `infrastructure/README.md`, `n8n/FLUJO_WHATSAPP_BUSINESS.md`
- Cost: ~€19/month (EC2 + disk + S3)

**n8n Workflow (OLD - Easypanel - A ELIMINAR):**
- URL: https://n8n-n8n.ljmvxa.easypanel.host (mantener hasta migrar workflows)
- EC2: i-0d996fc570003cba4 (t3.micro, 34.252.206.192)
- Estado: Deprecado, eliminar tras migración completa

**Stripe:**
- Test mode keys for development
- Production keys for deployment
- Webhook events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`

**Google Calendar:**
- Integration managed by n8n workflow
- Source of truth for availability
- Create events on confirmed reservations

**Airtable:**
- Stores reservation records
- Base/table IDs configured in n8n workflow

## Demo Users

**Admin User:**
- Email: `admin@happyhub.es`
- Password: Hashed with bcrypt in `/api/auth.ts`
- Role: `admin`

**Provider User:**
- Email: `proveedor@happyhub.es`
- Password: Hashed with bcrypt in `/api/auth.ts`
- Role: `provider`

**Note:** These are demo users for development. Production should use real auth provider.

## Local Development

**Ports:**
- Next.js dev server: `3000`
- n8n instance: Configured separately (external)

**Commands:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

**Testing n8n Integration:**
- Script: `n8n/test-webhook.sh`
- Sample payloads: `n8n/test-examples.json`

## Important URLs

**Production:**
- App URL: Configured via `NEXTAUTH_URL`
- Stripe Dashboard: https://dashboard.stripe.com
- n8n Instance: Configured separately

**Development:**
- Local App: http://localhost:3000
- Use ngrok for Stripe webhook testing: `ngrok http 3000`

## Pages and Routes

**Public Pages:**
- `/` - Home
- `/servicios` - Services catalog
- `/disponibilidad` - Availability calendar
- `/reservas` - Reservation form
- `/contacto` - Contact form

**Authenticated Pages:**
- `/mi-reserva/[id]` - View specific reservation
- `/proveedores` - Provider dashboard (provider role)
- `/admin` - Admin dashboard (admin role)

## Tech Stack

**Framework:**
- Next.js 14 (Pages Router, not App Router)
- React 18
- TypeScript

**Styling:**
- Tailwind CSS
- Custom theme: primary (red-orange), secondary (blue)

**Key Libraries:**
- `react-hook-form` + `zod` - Form validation
- `axios` - API client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `stripe` - Payment processing
- `react-calendar` - Calendar UI
- `micro` - Raw body parsing for webhooks

## Spanish Holidays 2025

**Holidays in pricing logic:**
- 2025-01-01 (Año Nuevo)
- 2025-01-06 (Reyes)
- 2025-04-18 (Viernes Santo)
- 2025-05-01 (Día del Trabajo)
- 2025-08-15 (Asunción)
- 2025-10-12 (Día de la Hispanidad)
- 2025-11-01 (Todos los Santos)
- 2025-12-06 (Constitución)
- 2025-12-08 (Inmaculada)
- 2025-12-25 (Navidad)

**Location:** `src/utils/pricing.ts` - `holidays2025` array
**Action Required:** Update array for 2026+ when year changes

## AWS Infrastructure (DEPLOYED - Desde 2025-12-23)

### AWS Services Architecture

**Compute:**
- **EC2 n8n Server (PRODUCTION)** ✅ DEPLOYED
  - Instance ID: i-0b869fcbf14768c25
  - Instance type: t3.small (2 vCPU, 2GB RAM)
  - Region: eu-west-1 (Ireland)
  - Public IP: 52.208.80.224
  - Estado: running
  - Launched: 2026-02-24 21:15:15 UTC
  - Nombre: n8n-production-happyhub
  - OS: Ubuntu 22.04 LTS
  - Disk: 30GB gp3
  - Services: Docker (n8n + PostgreSQL + Nginx)
  - Backups: Automated weekly → S3 (happyhub-n8n-backups)
  - Coste estimado: ~€19/mes (t3.small + 30GB disk + S3)

**Database:**
- **Aurora Serverless v2**: PostgreSQL-compatible (~25€/mes)
  - Min capacity: 0.5 ACU
  - Max capacity: 2 ACU
  - Auto-scaling based on load
  - Automated backups and point-in-time recovery

**Storage & CDN:**
- **S3**: Media storage (~5€/mes for 50GB)
  - Bucket (existente): happyhub-assets-prod (us-east-1)
    - Creado: 2025-12-25
    - Estado: Vacío, listo para usar
  - Bucket (planificado): happyhub-media-production (eu-west-1)
  - Lifecycle: Move to S3 Glacier after 90 days
- **CloudFront**: CDN for media delivery (~5€/mes)
  - Edge locations: Global
  - Cache TTL: 1 day for images, 7 days for static assets

**AI & ML:**
- **Bedrock**: Claude models for AI features (~15€/mes)
  - Model: Claude 3 Haiku (cost-efficient) or Sonnet (better quality)
  - Use cases: Event planning assistant, content generation
- **Rekognition**: Photo analysis (~10€/mes)
  - Face detection and tagging
  - Object recognition for photo organization

**Serverless:**
- **Lambda**: Event processing (~5€/mes)
  - Image resizing on upload
  - Webhook processors
  - Scheduled tasks (cleanup, reports)

**Communication:**
- **SES**: Email sending (~1€/mes for 5000 emails)
  - Transactional emails (confirmations, receipts)
  - Marketing campaigns
- **SNS**: Push notifications (~1€/mes)
  - Event reminders
  - Booking confirmations

**Total Monthly Cost:** ~93€/mes = 1116€/año
- n8n Production: ~€19/mes (upgraded from €8/mes)
- Aurora, S3, CloudFront, Bedrock, Lambda, Rekognition, SES, SNS: ~€74/mes
- ⚠️ Excede crédito $1000 por €116/año (revisar optimizaciones)

### AWS Account Information

**Account Details:**
- AWS Account ID: 128959995116
- Region: eu-west-1 (Europa - Irlanda)
- Billing alerts: Configured at 50€, 75€, 90€
- Budget: Hard limit at 100€/mes

**IAM Users:**

1. **edugarciac** (Application User)
   - Purpose: Node.js/Next.js application access
   - Access Key: AKIAXXXXXXXXXXXXXX
   - Usage: Backend services (S3, SES, Lambda, etc.)
   - Location: `.env.local` → `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

2. **happyhub-cli** (CLI User) ✅ CONFIGURADO
   - Purpose: Terminal operations with AWS CLI
   - Access Key: AKIAXXXXXXXXXXXXXX
   - Usage: `aws --profile happyhub-cli <command>`
   - Location: `aws-credentials-cli.local`, `.env.local`
   - Setup: Instalado en `~/.aws/credentials` y `~/.aws/config`
   - Setup script: `./scripts/aws-cli-setup.sh`
   - Documentation: `docs/aws/AWS_CLI_CREDENTIALS.md`
   - Permisos IAM: ✅ Configurados (S3, EC2, STS access verified)

**IAM Roles (Planned):**
- EC2 role: For n8n to access S3, SES, SNS
- Lambda execution role: For serverless functions
- CI/CD role: For deployments from GitHub Actions

**Regions:**
- Primary: eu-west-1 (Ireland) - optimal pricing
- Alternative: eu-south-2 (Spain) - lower latency, higher cost
- Backup: eu-central-1 (Frankfurt) - disaster recovery

### Deployment Strategy

**Phase 1: Infrastructure Setup (Week 1)**
- Create VPC with public/private subnets
- Deploy Aurora DB cluster
- Setup S3 buckets with proper policies
- Configure CloudFront distribution

**Phase 2: Application Migration (Week 2)**
- Deploy n8n on EC2
- Migrate workflows from current n8n instance
- Deploy Next.js application
- Update DNS records

**Phase 3: Testing & Launch (Week 3-4)**
- Integration testing
- Load testing
- Monitoring setup (CloudWatch)
- Public launch

### AWS Amplify Deployment

**Frontend Hosting:**
- Service: AWS Amplify (Next.js SSR support)
- Build configuration: `amplify.yml` in repository root
- Environment variables: Set in Amplify Console (Build Settings → Environment Variables)

**Required Amplify Environment Variables:**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `DB_HOST` - Database host
- `DB_PORT` - Database port (5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXTAUTH_URL` - **CRITICAL** - Production app URL (e.g., https://main.d123abc.amplifyapp.com)
- `NEXTAUTH_SECRET` - NextAuth secret key
- `JWT_SECRET` - JWT signing secret
- `N8N_WEBHOOK_URL` - n8n webhook endpoint
- `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` - Enable/disable Google OAuth (true/false)

**Build Process:**
1. Environment variables written to `.env.production` (see `amplify.yml`)
2. Next.js build runs with those variables
3. Build artifacts deployed to Amplify CDN

**Common Issues:**
- Empty `NEXTAUTH_URL` causes "Invalid URL" error at build time
- NextAuth requires `NEXTAUTH_URL` to be set in both Amplify Console and `next.config.js`

### AWS Environment Variables (EC2/Infrastructure)

**Additional AWS-specific variables:**
- `AWS_REGION` - AWS region (eu-west-1)
- `AWS_ACCESS_KEY_ID` - IAM user access key (in `.env`)
- `AWS_SECRET_ACCESS_KEY` - IAM secret key (in `.env`)
- `AWS_S3_BUCKET` - S3 bucket name for media
- `AWS_CLOUDFRONT_DOMAIN` - CloudFront distribution domain
- `DATABASE_URL` - Aurora PostgreSQL connection string (in `.env`)

### Monitoring & Alerts

**CloudWatch Dashboards:**
- EC2 metrics: CPU, memory, disk, network
- Aurora metrics: Connections, queries, storage
- Lambda metrics: Invocations, errors, duration
- S3 metrics: Storage size, requests

**Alarms:**
- EC2 CPU > 80% for 5 minutes
- Aurora connections > 80% of max
- Lambda error rate > 5%
- Estimated monthly bill > 90€

### Backup Strategy

**Aurora:**
- Automated daily backups (7 days retention)
- Manual snapshots before major changes
- Point-in-time recovery enabled

**S3:**
- Versioning enabled for media bucket
- Cross-region replication to eu-central-1 (opcional si hay presupuesto)
- Lifecycle policy: Archive to Glacier after 90 days

**Application Code:**
- GitHub repository (already configured)
- Automated deployments via GitHub Actions

## Revenue Model & Digital Services

### Space Rental (Base Revenue - Año 1)
- Morning: 110-145€/sesión (según día semana)
- Afternoon: 110-185€/sesión (según día semana)
- Evening: Consultar (precio variable)
- Average per event: ~150€ (weighted mix: 60% weekend, 40% weekday)
- Target año 1: 25-40 eventos/mes = 3.750-6.000€/mes
- ARR año 1: 45.000-72.000€

### Digital Services (High Margin - DESARROLLO AÑO 2)

**ESTADO:** A desarrollar después de validar product-market fit con alquiler de espacio.

**Servicios Planificados (AWS-Powered):**

**AI Event Planning Premium:** 50€/evento
- Asistente conversacional con Bedrock Claude
- Sugerencias personalizadas de paquetes
- Timeline automatizado del evento

**Custom Content Package:** 80€/evento
- Invitaciones digitales generadas por IA
- Posts para redes sociales (3-5 diseños)
- Video de agradecimiento post-evento
- Powered by Bedrock

**3D Printed Merchandise:** 30-100€/evento
- Diseños personalizados o biblioteca pre-diseñada
- Archivos almacenados en S3

**Smart Photocall + AI Editing:** 120€/evento
- Upload en tiempo real a S3
- Face tagging con Rekognition
- Galería organizada automáticamente
- Entrega en 24h post-evento

**Cloud Memory Vault:** 30€/evento
- 1 año de almacenamiento en S3
- Acceso web a galería privada
- Descargas ilimitadas

**Target Año 2:**
- Average Digital Services per Event: 100-150€
- Attach rate objetivo: 40-60%
- Ingreso por evento: 250-300€ total

### Marketplace Commission (Scalable)
- Catering: 10% comisión (pedido medio 500€ = 50€)
- Otros proveedores (DJ, decoración, etc.): 15% comisión
- Expected: 80-150€/evento

### Total Average Revenue per Event

**Año 1 (Solo Espacio):**
- Space: 150€
- **Total: 150€/evento**
- Monthly Projection (30 eventos): 4.500€/mes = 54.000€/año

**Año 2 (Con Servicios Digitales):**
- Space: 150€ (precio NO sube)
- Digital (40-60% attach): 50-100€
- Marketplace (opcional): 30-50€
- **Total: 230-250€/evento**
- Monthly Projection (40 eventos): 10.000€/mes = 120.000€/año

**Año 3 (Optimización Capacidad):**
- 50 eventos × 250€ = 12.500€/mes = 150.000€/año

**Año 5 (Expansión Sostenible a 5 Locales):**
- 5 locales × 30 eventos × 250€ = 37.500€/mes = 450.000€/año
- Modelo: Crecer gradualmente, validar cada local antes del siguiente
- Foco: Barcelona (Gracia, Sarrià, Eixample, Sant Gervasi)

## Comandos Útiles n8n Production

**SSH a la instancia:**
```bash
ssh -i ~/.ssh/n8n-happyhub-key.pem ubuntu@52.208.80.224
```

**Ver estado de servicios:**
```bash
ssh -i ~/.ssh/n8n-happyhub-key.pem ubuntu@52.208.80.224 'sudo n8n-status.sh'
```

**Ver logs de n8n:**
```bash
ssh -i ~/.ssh/n8n-happyhub-key.pem ubuntu@52.208.80.224 'cd /opt/n8n && sudo docker-compose logs -f n8n'
```

**Reiniciar n8n:**
```bash
ssh -i ~/.ssh/n8n-happyhub-key.pem ubuntu@52.208.80.224 'cd /opt/n8n && sudo docker-compose restart n8n'
```

**Backup manual:**
```bash
ssh -i ~/.ssh/n8n-happyhub-key.pem ubuntu@52.208.80.224 'sudo /opt/backups/backup-n8n.sh'
```

**Listar backups en S3:**
```bash
aws s3 ls s3://happyhub-n8n-backups/backups/ --profile happyhub-cli
```

**Eliminar instancia antigua (cuando esté listo):**
```bash
aws ec2 terminate-instances --instance-ids i-0d996fc570003cba4 --profile happyhub-cli --region eu-west-1
```

## Tips

- Keep this file updated when configuration changes
- Never commit secrets or API keys here
- Update holiday array annually
- Document any new environment variables
- Update AWS costs monthly based on actual usage
- Change n8n admin password on first login
- Test n8n backups monthly (restore to verify)
