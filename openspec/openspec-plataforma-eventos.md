# OpenSpec: HappyHub - plataforma de eventos

## Vision

HappyHub es una plataforma que unifica tres productos en torno a eventos y comunidades:

1. **Evento unico** - Fiestas, bodas, cenas de empresa. Pago por evento (9-149 EUR segun tier). El usuario reserva fecha, elige extras, paga deposito. Ya implementado como MVP.
2. **Espacio recurrente** - Yoga, pilates, talleres, reuniones semanales. Suscripcion mensual al espacio o actividad. Calendario, reservas, cobro automatico, gestion de bajas. Competidores: Mindbody, Glofox (caros y complejos). Nuestro hueco: espacios pequenos y comunidades informales, onboarding en 5 minutos, sin contrato.
3. **Evento colaborativo** - Fin de curso, despedidas, celebraciones de grupo. El diferenciador real. El organizador crea el evento y define roles (decoracion, musica...). Los participantes eligen o se asignan tareas con fechas y presupuesto. Votaciones sobre decisiones clave. Dia D: guion y timeline compartido. Post: album y video resumen. No existe nada parecido bien resuelto en el mercado (hoy se necesita Notion + WhatsApp + Google Photos + Bizum).

## Sinergia entre modulos

El modulo recurrente genera comunidad, que organiza eventos colaborativos, que culminan en eventos unicos. Ejemplo: el grupo de yoga que lleva 6 meses reservando (modulo 2) organiza una fiesta de fin de temporada donde todos participan (modulo 3) con catering y decoracion (modulo 1). La plataforma acompana todo el ciclo. Esta sinergia es el moat: un competidor que solo haga una de las tres cosas no puede replicarla.

## Principios de producto

- **Simplicidad radical**: si requiere mas de 3 taps para completar una accion, hay que redisenar. Tricount funciona porque es simple; Splitwise fallo por over-engineering.
- **WhatsApp-first**: la gente ya vive en WhatsApp. No reinventar la rueda, integrar. Notificaciones, compartir fotos, enlaces al evento, votaciones rapidas.
- **Coste compartido nativo**: reparto de gastos integrado en todo (estilo Tricount). Compras de material, contrataciones de proveedores, cuotas de suscripcion. El grupo ve en tiempo real quien debe que.
- **Fotos sin friccion**: importar desde WhatsApp, Google Photos, iCloud, o camara directa. Album compartido automatico del evento. Sin necesidad de app adicional.
- **Mobile-first, web-capable**: la experiencia primaria es movil, pero funciona completo en web.

## Modelo de negocio

| Modulo | Modelo | Rango de precio |
|--------|--------|-----------------|
| Evento unico | Pago por evento | 9-149 EUR segun tier |
| Espacio recurrente | Suscripcion mensual | 19-79 EUR/mes segun capacidad |
| Evento colaborativo | Pago por evento + upsells de contenido | 4.99-29.99 EUR (album IA, video resumen) |

Comision sobre split de gastos: 0% (diferenciador vs Tricount premium). Monetizacion via eventos y contenido, no via el reparto.

## Estrategia de lanzamiento

**Fase 1 (actual)**: Evento unico - MVP funcional con reservas, pagos Stripe, area privada.
**Fase 2**: Evento colaborativo - wedge product diferenciador. Tareas, votaciones, timeline, split de gastos, album compartido.
**Fase 3**: Espacio recurrente - ingresos predecibles. Suscripciones, calendario recurrente, cobro automatico.

Razon: el colaborativo es el mas diferenciado y viral (el grupo entero lo usa y lo comparte). El recurrente genera MRR pero tiene competidores establecidos, mejor entrar con traccion.

## Stack tecnico

- **Frontend**: Next.js 14 (Pages Router), React 18, TypeScript, Tailwind CSS
- **Backend**: API Routes Next.js, PostgreSQL (Neon serverless)
- **Pagos**: Stripe (checkout, suscripciones, Connect para splits)
- **Autenticacion**: NextAuth.js (credentials + Google OAuth)
- **Integraciones**: WhatsApp Business API, n8n workflows, Google Photos API
- **Almacenamiento fotos**: S3/Cloudflare R2 (coste bajo para volumen alto)
- **Deploy**: AWS Amplify

## Capacidades cross-module

### WhatsApp integration
- Notificaciones de eventos y recordatorios
- Compartir enlaces de evento via WhatsApp
- Importar fotos desde chats de WhatsApp
- Votaciones rapidas via WhatsApp (link a web)
- Resumen del evento enviado al grupo

### Expense splitting (estilo Tricount)
- Anadir gastos con descripcion, importe, pagador
- Repartir equitativamente o por porcentajes/cantidades
- Saldo en tiempo real de quien debe a quien
- Liquidacion simplificada (minimas transferencias)
- Integración con Bizum/Stripe para pagos directos
- Historial de gastos exportable

### Photo management
- Album compartido por evento
- Import desde WhatsApp, Google Photos, iCloud
- Upload directo desde camara/galeria
- Organizacion automatica por fecha/hora
- Album resumen generado con IA (upsell)
- Video resumen automatico (upsell)

## Changes (OpenSpec)

Cada modulo y capacidad cross-module se desarrolla como un change independiente:

| Change | Modulo | Prioridad | Dependencias |
|--------|--------|-----------|--------------|
| `event-photos` | M1 - Evento unico | P1 | storage setup |
| `collaborative-event-core` | M3 - Evento colaborativo | P1 | auth, DB |
| `collaborative-tasks-voting` | M3 - Evento colaborativo | P1 | collaborative-event-core |
| `expense-splitting` | Cross-module | P1 | auth, DB |
| `whatsapp-integration` | Cross-module | P2 | WhatsApp Business API |
| `recurring-spaces` | M2 - Espacio recurrente | P3 | Stripe subscriptions |
| `photo-import-platforms` | Cross-module | P2 | event-photos, platform APIs |
| `ai-album-video` | Cross-module | P3 | event-photos, AI service |
