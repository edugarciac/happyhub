# HappyHub - Event Space Rental Platform

HappyHub es una plataforma web completa para la gestión y reserva de espacios para eventos como cumpleaños, comuniones, bautizos y otras celebraciones.

## 🚀 Características

- **Sistema de reservas online**: Formulario completo con validación y cálculo de precios
- **Calendario interactivo**: Visualización de disponibilidad en tiempo real
- **Gestión de servicios**: Catering, animación, decoración, fotografía y más
- **Área privada**: Los clientes pueden ver y gestionar sus reservas
- **Panel de proveedores**: Gestión de solicitudes de servicios
- **Panel de administración**: Estadísticas, calendario maestro e informes
- **Integración con n8n**: Automatización de workflows (confirmaciones, recordatorios)
- **Pagos con Stripe**: Múltiples métodos de pago seguros
- **Diseño responsive**: Optimizado para móvil, tablet y escritorio

## 📋 Requisitos previos

- Node.js 18.x o superior
- npm o yarn
- Cuenta de Vercel (para deploy)
- Cuenta de n8n (para automatizaciones)
- Cuenta de Stripe (para pagos)

## 🛠️ Instalación local

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd happyhub-web
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   Copia el archivo `.env.example` a `.env` y completa las variables:
   ```bash
   cp .env.example .env
   ```

   Edita `.env` con tus credenciales:
   ```env
   # n8n Configuration
   N8N_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/reserva

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=genera-un-secret-aqui

   # Claude API (opcional)
   CLAUDE_API_KEY=sk-ant-...

   # Security
   JWT_SECRET=otro-secret-aqui
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Estructura del proyecto

```
happyhub-web/
├── src/
│   ├── components/          # Componentes React reutilizables
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── Calendar.tsx
│   │   ├── ReservationForm.tsx
│   │   └── ProviderCard.tsx
│   ├── pages/              # Páginas Next.js
│   │   ├── index.tsx       # Home
│   │   ├── servicios.tsx   # Servicios
│   │   ├── disponibilidad.tsx
│   │   ├── reservas.tsx
│   │   ├── contacto.tsx
│   │   ├── proveedores.tsx
│   │   ├── admin.tsx
│   │   ├── mi-reserva/
│   │   │   └── [id].tsx    # Vista de reserva individual
│   │   └── api/            # API Routes
│   │       ├── webhook-reserva.ts
│   │       ├── stripe-webhook.ts
│   │       └── auth.ts
│   ├── lib/                # Configuraciones de librerías
│   │   ├── stripe.ts
│   │   └── apiClient.ts
│   ├── utils/              # Utilidades
│   │   ├── validators.ts
│   │   └── formatters.ts
│   └── styles/             # Estilos globales
│       ├── globals.css
│       └── variables.css
├── public/                 # Archivos estáticos
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🌐 Deploy en Vercel

1. **Instalar Vercel CLI** (opcional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy desde el dashboard de Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub/GitLab/Bitbucket
   - Configura las variables de entorno en el dashboard
   - Haz click en "Deploy"

3. **Deploy desde CLI**
   ```bash
   vercel
   ```

4. **Configurar variables de entorno en Vercel**

   En el dashboard de Vercel, ve a Settings > Environment Variables y añade:
   - `N8N_WEBHOOK_URL`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXTAUTH_URL` (usa tu dominio de producción)
   - `NEXTAUTH_SECRET`
   - `CLAUDE_API_KEY` (opcional)
   - `JWT_SECRET`

5. **Configurar webhook de Stripe**

   En el dashboard de Stripe, configura un webhook que apunte a:
   ```
   https://tu-dominio.vercel.app/api/stripe-webhook
   ```

## ⚙️ Configuración de n8n

### Workflows necesarios

1. **Webhook de reservas** (`/webhook/reserva`)
   - Recibe datos del formulario
   - Crea evento en Google Calendar
   - Guarda en Airtable/base de datos
   - Envía confirmación por email/WhatsApp
   - Genera link de pago Stripe

2. **Recordatorios automáticos**
   - Trigger: Cron (diario)
   - Consulta reservas próximas
   - Envía recordatorios 48h y 24h antes

3. **Post-evento**
   - Trigger: Cron (diario)
   - Consulta eventos completados
   - Envía email de valoración

4. **Notificaciones a proveedores**
   - Trigger: On reserva con extras
   - Envía solicitud a proveedores
   - Espera confirmación

### Seguridad en n8n

- Habilita autenticación por API key
- Valida origin de las requests
- Usa HTTPS siempre

## 💳 Configuración de Stripe

1. **Crear cuenta en Stripe**
   - Ve a [stripe.com](https://stripe.com)
   - Completa el registro

2. **Obtener API keys**
   - Dashboard > Developers > API keys
   - Copia las keys (test y production)

3. **Configurar webhook**
   - Dashboard > Developers > Webhooks
   - Añade endpoint: `https://tu-dominio.vercel.app/api/stripe-webhook`
   - Selecciona eventos:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed`

4. **Obtener webhook secret**
   - Copia el signing secret del webhook
   - Añádelo a `STRIPE_WEBHOOK_SECRET`

## 📱 Funcionalidades principales

### Para clientes
- Ver disponibilidad en calendario
- Reservar eventos con formulario guiado
- Seleccionar servicios extras (catering, animación, etc.)
- Pagar online de forma segura
- Ver y gestionar reservas
- Recibir confirmaciones y recordatorios automáticos

### Para proveedores
- Ver solicitudes de servicios
- Aceptar o rechazar trabajos
- Gestionar su calendario

### Para administradores
- Dashboard con estadísticas
- Gestión de todas las reservas
- Calendario maestro
- Informes mensuales
- Gestión de usuarios

## 🔒 Seguridad

- Validación de formularios con Zod
- Autenticación JWT para áreas privadas
- Verificación de webhooks de Stripe
- HTTPS en producción
- Variables de entorno para secrets
- Sanitización de inputs

## 🎨 Personalización

### Colores
Edita `tailwind.config.js` para cambiar los colores primarios y secundarios:
```javascript
colors: {
  primary: {
    // Tus colores...
  },
  secondary: {
    // Tus colores...
  },
}
```

### Contenido
- Textos: Edita los componentes en `src/pages/` y `src/components/`
- Imágenes: Añade tus imágenes en `public/`
- Estilos: Modifica `src/styles/globals.css`

## 📊 Analytics y seguimiento

Para añadir Google Analytics u otra herramienta:

1. Añade el script en `src/pages/_document.tsx`
2. O usa un paquete como `next-google-analytics`

## 🧪 Testing

```bash
# Ejecutar tests (cuando se implementen)
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🐛 Troubleshooting

### Error: "N8N_WEBHOOK_URL no está configurada"
- Verifica que la variable de entorno esté configurada en `.env`
- En Vercel, comprueba las Environment Variables

### Error de Stripe: "Invalid signature"
- Verifica que `STRIPE_WEBHOOK_SECRET` sea correcto
- Comprueba que el endpoint del webhook esté bien configurado

### Calendario no muestra fechas bloqueadas
- Implementa la lógica para consultar fechas ocupadas desde tu base de datos
- Actualiza el componente `Calendar.tsx`

## 📞 Soporte

Para dudas o problemas:
- Email: info@happyhub.es
- GitHub Issues: [Crear issue](link-to-repo/issues)

## 📄 Licencia

Copyright © 2025 HappyHub. Todos los derechos reservados.

## 🙏 Agradecimientos

- Next.js
- Tailwind CSS
- Stripe
- n8n
- Vercel

---

Hecho con ❤️ por el equipo de HappyHub
