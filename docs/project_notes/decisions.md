# Architectural Decisions

Document key architectural choices, their context, and trade-offs.

## Decisions

### ADR-001: Use Pages Router Instead of App Router (2025-01)

**Context:**
- Next.js 14 supports both Pages Router and new App Router
- Project was started before App Router was stable
- Need stable API routes and authentication patterns

**Decision:**
- Use Pages Router (`pages/` directory structure)
- API routes in `pages/api/`
- Client-side routing with `next/router`

**Alternatives Considered:**
- App Router → Rejected: Migration overhead, authentication patterns still evolving
- Pure React SPA → Rejected: Need SSR for SEO and initial load performance

**Consequences:**
- ✅ Stable patterns and well-documented
- ✅ API routes easy to implement
- ✅ No breaking changes on Next.js updates
- ❌ Missing some new App Router features (Server Components, layouts)
- ❌ Future migration effort if we switch

### ADR-002: JWT in localStorage for Authentication (2025-01)

**Context:**
- Need simple authentication for demo users
- Three roles: client, provider, admin
- No OAuth or external auth provider initially

**Decision:**
- Store JWT tokens in localStorage
- Demo users hardcoded in `/api/auth` with bcrypt hashing
- Token auto-injected via axios interceptor in `apiClient.ts`

**Alternatives Considered:**
- HttpOnly cookies → Rejected: More complex setup, CSRF protection needed
- NextAuth.js → Rejected: Overkill for simple demo auth
- Session storage → Rejected: Loses auth on tab close

**Consequences:**
- ✅ Simple implementation
- ✅ Works across all API calls automatically
- ❌ Vulnerable to XSS attacks (localStorage accessible by JS)
- ❌ No token refresh mechanism
- ❌ Will need to migrate for production (use HttpOnly cookies + refresh tokens)

### ADR-003: n8n for Workflow Automation (2025-01)

**Context:**
- Need to orchestrate multiple services: Google Calendar, Airtable, Email, Stripe
- Want visual workflow builder for non-developers
- Claude AI integration for personalized messages

**Decision:**
- Use n8n as external workflow engine
- Webhook triggers from Next.js API
- n8n handles: Calendar, Airtable, email, payment link creation

**Alternatives Considered:**
- Build custom backend → Rejected: Too much development time
- Zapier → Rejected: Cost, less flexibility for Claude integration
- In-app logic → Rejected: Mixes concerns, harder to maintain

**Consequences:**
- ✅ Visual workflow editing
- ✅ Easy to add/modify integrations
- ✅ Claude AI integration for personalized messages
- ❌ External dependency (n8n must be running)
- ❌ Network latency on workflow execution
- ❌ Debugging more complex (check n8n logs + Next.js logs)

### ADR-004: Centralized Pricing Logic in src/utils/pricing.ts (2025-01)

**Context:**
- Complex pricing rules: weekdays vs weekends vs holidays vs holiday eves
- Three time slots with different prices
- Spanish holiday calendar
- Need consistency across booking form and availability calendar

**Decision:**
- Single source of truth: `src/utils/pricing.ts`
- `calculateBasePrice(date, timeSlot)` for all price calculations
- `getAvailableTimeSlotsWithPricing(date)` for UI displays
- Holiday array hardcoded (update annually)

**Alternatives Considered:**
- Database-driven pricing → Rejected: Overkill, rules are static
- Stripe product pricing → Rejected: Not flexible enough for business rules
- Per-component pricing → Rejected: Creates inconsistencies

**Consequences:**
- ✅ Single source of truth
- ✅ Easy to update pricing rules in one place
- ✅ Holiday detection logic centralized
- ❌ Must update holiday array annually
- ❌ No dynamic pricing without code changes

### ADR-005: Availability Validation in n8n Workflow (2025-01)

**Context:**
- Need to prevent double-bookings
- Google Calendar is source of truth for reservations
- Want to validate before creating Airtable records

**Decision:**
- n8n workflow queries Google Calendar before creating reservation
- Returns 409 error if date/time conflict detected
- Frontend shows user-friendly message on conflict

**Alternatives Considered:**
- Client-side validation only → Rejected: Race conditions possible
- Database locking → Rejected: No database, using Airtable
- Optimistic booking → Rejected: Creates bad UX with conflicts

**Consequences:**
- ✅ Prevents double-bookings
- ✅ Calendar is source of truth
- ✅ User gets immediate feedback
- ❌ Requires n8n workflow to be up-to-date
- ❌ Slight latency on reservation creation (extra API call)

### ADR-006: Migración a Infraestructura AWS (2025-01-27)

**Context:**
- Recibido crédito de $1000 del programa AWS Startups
- Actualmente en Vercel free tier (solo demo, no producción)
- Necesidad de infraestructura escalable para lanzamiento público
- Oportunidad de incorporar servicios de IA (Bedrock) para diferenciación competitiva
- Posicionamiento como startup tecnológica, no solo venue de eventos

**Decision:**
- Migrar toda la infraestructura de Vercel a AWS
- Arquitectura basada en: EC2 (n8n), Aurora Serverless v2 (DB), S3+CloudFront (media), Bedrock (IA), Lambda (procesamiento), Rekognition (fotos), SES/SNS (comunicaciones)
- Presupuesto: ~82€/mes = 984€/año (dentro del crédito de $1000)
- Timeline: 30 días para migración y lanzamiento público

**Alternatives Considered:**
- Quedarse en Vercel → Rejected: Sin servicios de IA, sin escalabilidad para workflows complejos, limitaciones en base de datos
- DigitalOcean/Hetzner → Rejected: Sin servicios gestionados de IA, más trabajo manual
- Google Cloud Platform → Rejected: Menor soporte del programa startups, crédito AWS ya aprobado
- Azure → Rejected: Menos experiencia del equipo, crédito AWS disponible

**Consequences:**
- ✅ Acceso a AWS Bedrock para features de IA competitivas
- ✅ Infraestructura escalable para 20-40 eventos/mes y crecimiento
- ✅ Aurora DB para datos relacionales vs Airtable
- ✅ Soporte del programa AWS Startups (networking, recursos)
- ✅ S3+Rekognition para servicios digitales premium (photocall, cloud vault)
- ✅ Costes predecibles: ~82€/mes durante primer año
- ❌ Curva de aprendizaje AWS (más complejo que Vercel)
- ❌ Responsabilidad de gestionar más infraestructura (EC2, RDS, etc.)
- ❌ Lock-in vendor (migraciones futuras más complejas)
- ❌ Necesidad de monitorización y alertas activas

**Servicios Clave y Casos de Uso:**
- **EC2 t3.small**: n8n workflows (Google Calendar, Stripe, emails)
- **Aurora Serverless v2**: Reservas, clientes, servicios (reemplaza Airtable)
- **Bedrock Claude**: Asistente IA planificación eventos, generación contenido
- **S3**: Almacenamiento fotos/videos eventos, archivos 3D printing
- **Lambda + Rekognition**: Procesamiento fotos photocall, face tagging
- **SES**: Emails transaccionales y campañas
- **SNS**: Notificaciones push a clientes

**Decisiones Técnicas Relacionadas:**
- Mantener Next.js en EC2 o migrar a Amplify (decisión pendiente)
- Aurora vs RDS PostgreSQL estándar → Aurora por escalabilidad automática
- CloudFront CDN para distribución global de contenido estático

**Update 2025-02-18: Plan de Migración Completado**
- ✅ Infraestructura existente detectada: EC2 n8n-server (running), S3 bucket (happyhub-assets-prod)
- ✅ AWS CLI configurado con usuario happyhub-cli
- ✅ Permisos IAM verificados (S3, EC2, STS access)
- 📋 Plan completo de migración documentado: `docs/aws/PLAN_MIGRACION_A_AWS.md`
- 🔧 Scripts de ayuda creados: `scripts/migration-checklist.sh`
- Timeline objetivo: 3 semanas (conservador) o 1 semana (agresivo)
- Coste actual AWS: ~8€/mes (solo EC2), estimado post-migración: ~50€/mes
- **Próximo paso**: Fase 0 - Backup de Airtable y preparación

### ADR-007: Migrar base de datos de Aurora RDS a Neon PostgreSQL (2026-02-22)

**Context:**
- Aurora RDS desplegada en VPC privada sin endpoint público
- La aplicación (local y Vercel) no podía acceder a la DB por red privada
- El driver `@neondatabase/serverless` ya instalado es incompatible con Aurora RDS (es el driver propietario de Neon, no un driver PostgreSQL genérico)
- Doble fallo: red privada + driver equivocado = acceso imposible desde cualquier entorno

**Decision:**
- Usar Neon PostgreSQL (https://neon.tech) en lugar de Aurora RDS
- `DATABASE_URL` apunta al endpoint de Neon (público via HTTPS/WebSocket)
- Configurar `neonConfig.webSocketConstructor = ws` en `src/lib/db.ts` para entorno Node.js
- Aurora RDS puede mantenerse como backup o eliminarse para reducir costes AWS

**Alternatives Considered:**
- Hacer Aurora públicamente accesible → Rejected: riesgo de seguridad, requiere cambios de red VPC
- Bastion host + SSH tunnel → Rejected: complejo, frágil para entorno serverless
- Quedarse en Aurora → Rejected: incompatible con driver ya instalado y arquitectura serverless

**Consequences:**
- ✅ Acceso desde local, Vercel y cualquier entorno serverless
- ✅ Driver `@neondatabase/serverless` funciona nativamente con Neon
- ✅ Free tier suficiente para desarrollo y escala inicial (3GB storage)
- ✅ No requiere configuración de red ni VPN
- ❌ Salir del ecosistema AWS (si bien Neon usa AWS internamente)
- ❌ Revisar si se mantiene Aurora para reducir costes (~25€/mes)

## Tips

- Number decisions sequentially
- Update if decisions are revisited
- Include date for historical context
- Be honest about trade-offs
