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

### ADR-007: Documentar Todas las Incidencias como Bugs (2026-02-22)

**Context:**
- Durante desarrollo surgen múltiples problemas técnicos (conexión BD, configuración, etc.)
- Sin documentación sistemática, se repiten los mismos problemas en futuras sesiones
- Claude Code tiene memoria limitada entre sesiones
- Necesidad de mantener conocimiento institucional del proyecto

**Decision:**
- Usar skill `project-memory` para registrar TODAS las incidencias en `bugs.md`
- Cada entrada debe incluir: fecha, problema, causa raíz, solución, prevención
- Registrar inmediatamente cuando se resuelve un problema
- Buscar en `bugs.md` antes de diagnosticar problemas nuevos

**Alternatives Considered:**
- Solo documentar bugs críticos → Rechazado: Los bugs "pequeños" se repiten
- Documentar en comentarios del código → Rechazado: Difícil de buscar, se pierde contexto
- No documentar → Rechazado: Repite trabajo, frustrante

**Consequences:**
- ✅ Base de conocimiento crece con cada problema resuelto
- ✅ Soluciones reutilizables entre sesiones
- ✅ Menos tiempo diagnosticando problemas repetidos
- ✅ Onboarding más rápido para nuevos desarrolladores
- ❌ Requiere disciplina para documentar consistentemente
- ❌ Archivo bugs.md puede crecer mucho (requiere limpieza periódica)

**Implementación:**
- Comando: `/project-memory` o `project-memory` skill
- Al resolver cualquier error: `project-memory update bugs with: [descripción del problema y solución]`
- Revisar `bugs.md` al inicio de cada sesión de desarrollo
- Limpieza manual cada 6 meses (archivar bugs muy antiguos)

### ADR-008: AWS Amplify para Despliegue Frontend (2026-03-08)

**Context:**
- ADR-006 mencionaba decisión pendiente entre EC2 o Amplify para Next.js
- Proyecto configurado originalmente con Vercel (vercel.json presente)
- Necesidad de CI/CD automatizado desde GitHub
- Infraestructura ya en AWS (EC2 para n8n, Aurora DB, S3, etc.)

**Decision:**
- Usar AWS Amplify para despliegue automático del frontend Next.js
- Configuración en `amplify.yml` con variables de entorno
- Despliegue automático al hacer push a rama `main`
- Mantener vercel.json para referencia pero no usar Vercel

**Alternatives Considered:**
- Vercel → Rechazado: No usar, infraestructura consolidada en AWS
- EC2 con PM2/nginx → Rechazado: Más gestión manual, sin CI/CD automático
- Elastic Beanstalk → Rechazado: Más complejo que Amplify para Next.js
- CloudFront + S3 (export estático) → Rechazado: Perdemos SSR y API routes

**Consequences:**
- ✅ CI/CD automático desde GitHub a producción
- ✅ Integración nativa con servicios AWS (variables de entorno, secrets)
- ✅ Escalado automático del frontend
- ✅ Preview deployments para pull requests
- ✅ Monitorización integrada en AWS Console
- ✅ Sin gestión de servidores (serverless)
- ❌ Coste adicional vs EC2 (pero incluido en crédito AWS)
- ❌ Lock-in adicional a AWS (pero ya comprometidos con AWS)

**Implementación:**
- Push a `main` → Amplify detecta cambios → build automático → despliegue
- Variables de entorno configuradas en AWS Amplify Console
- Build specification en `amplify.yml`

### ADR-009: Backup Diario de Neon DB con n8n + pg_dump + S3 (2026-05-01)

**Context:**
- Neon Postgres es el único almacén persistente de la plataforma
- Sin backup externo, un fallo en Neon o un borrado accidental implica pérdida total de datos
- Neon free tier ofrece PITR (point-in-time recovery) con ventana corta (~24h)
- La alternativa evaluada fue migrar a Supabase (que incluye backups diarios en free tier)
- La infraestructura existente (EC2 con n8n, S3 bucket `happyhub-assets-prod`, AWS CLI configurado) permite implementar la solución sin coste adicional

**Decision:**
- Mantener Neon como base de datos (no migrar a Supabase)
- Añadir backup diario automatizado: n8n cron → `pg_dump` → `aws s3 cp` → S3
- Workflow n8n ejecuta a las 02:00h, genera dump en formato custom, lo sube a `s3://happyhub-assets-prod/backups/YYYY-MM/`
- Las credenciales sensibles (`DATABASE_URL`, `AWS_S3_BUCKET`) se leen como variables de entorno del servidor EC2, no se hardcodean en el workflow

**Alternatives Considered:**
- Migrar a Supabase → Rechazado: mismo motor (PostgreSQL), coste de migración sin beneficio neto; Supabase free tier pausa proyectos inactivos 1 semana
- S3 Lifecycle Rules para retención → Aceptado como tarea futura, no urgente
- Alertas por WhatsApp en fallo → Aceptado como mejora futura; los logs de n8n son suficiente para la fase actual

**Consequences:**
- ✅ Backup externo bajo control propio, sin dependencia de Neon para recovery
- ✅ Coste cero (usa infraestructura ya existente)
- ✅ Sin cambios en el código de la aplicación
- ✅ Formato `--format=custom` permite restauración selectiva por tabla
- ✅ Pipe directo a S3 sin uso de disco en EC2
- ❌ Requiere `postgresql-client` instalado en el servidor n8n EC2
- ❌ No hay alerta activa en caso de fallo (depende de revisar logs de n8n)
- ❌ Sin retención automática hasta configurar S3 Lifecycle Rules

**Implementación:**
- Workflow: `n8n/n8n-nodes/n8n-db-backup-cron.json`
- Spec completo: `openspec/changes/database-backup-strategy/`

### ADR-010: Subida de Precios del 20% vía Script de Migración (2026-07-06)

**Context:**
- El negocio necesita subir todas las tarifas de franjas horarias un 20%
- Los precios ya viven en la tabla `pricing_rules` (ADR previo: `pricing-database-migration`), no en código
- Se busca un cambio auditable y repetible en vez de una edición manual fila a fila desde `/admin/pricing`

**Decision:**
- Migración `database/migrations/015_increase_pricing_20_percent.sql`: `UPDATE pricing_rules SET price = ROUND(price * 1.20, 2)`
- Script runner `scripts/run-pricing-increase-migration.js` (mismo patrón que `run-pricing-migration.js`), imprime precios antes/después para verificación
- Sin cambios de código: `pricingDb.ts` lee `pricing_rules` dinámicamente (caché de 5 min)

**Alternatives Considered:**
- Editar cada regla manualmente en `/admin/pricing` → Rechazado: propenso a errores, no auditable, tedioso para 9 filas
- Hardcodear los nuevos precios absolutos en el SQL → Rechazado: frágil si las reglas cambian antes de ejecutar el script

**Consequences:**
- ✅ Cambio de precio auditable vía control de versiones
- ✅ Reutilizable como plantilla para futuras subidas porcentuales
- ✅ Los slots "a consultar" (price=0) no se ven afectados
- ❌ No es idempotente: ejecutarlo dos veces compondría la subida (20% sobre 20%)
- ❌ Requiere `DATABASE_URL` configurado para ejecutarse; no se lanzó en este entorno por no tener acceso a la base de datos de producción

**Implementación:**
- Spec completo: `openspec/changes/pricing-rate-increase/`
- Ejecutar con: `node scripts/run-pricing-increase-migration.js`

## Tips

- Number decisions sequentially
- Update if decisions are revisited
- Include date for historical context
- Be honest about trade-offs
- Use project-memory skill for all bug documentation
