# Fase 4: Deploy a AWS Amplify - Guía Paso a Paso

**Objetivo**: Desplegar HappyHub en AWS Amplify con conexión a Aurora PostgreSQL.

**Duración estimada**: 45-60 minutos

**Pre-requisito**: Aurora PostgreSQL desplegado ✅

---

## 🎯 Resultado Final

Al terminar esta fase tendrás:
- ✅ HappyHub desplegado en AWS (URL pública)
- ✅ Schema PostgreSQL aplicado automáticamente
- ✅ CI/CD configurado (push a GitHub → auto-deploy)
- ✅ HTTPS con certificado SSL automático
- ✅ Variables de entorno configuradas

---

## 📋 Pre-requisitos

- [ ] Código en repositorio GitHub
- [ ] Aurora PostgreSQL corriendo (✅ completado)
- [ ] Variables de entorno documentadas

---

## 🚀 Paso 1: Preparar Repositorio GitHub

### 1.1. Verificar estado Git

```bash
git status
git log --oneline -5
```

### 1.2. Commit cambios pendientes

```bash
# Ver cambios
git diff

# Añadir archivos modificados (solo los necesarios, NO migration/)
git add src/lib/db.ts
git add src/pages/api/init-db.ts
git add .env.example
git add package.json

# Commit
git commit -m "Add PostgreSQL integration for AWS migration

- Add db.ts connection pool library
- Add init-db API route for schema setup
- Update environment variables
- Prepare for AWS Amplify deployment

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"

# Push a GitHub
git push origin main
```

---

## 🌐 Paso 2: Configurar AWS Amplify desde Console

### 2.1. Abrir AWS Amplify Console

```bash
open "https://eu-west-1.console.aws.amazon.com/amplify/home?region=eu-west-1#/"
```

### 2.2. Crear Nueva Aplicación

1. Click **"New app"** → **"Host web app"**
2. Seleccionar: **"GitHub"**
3. Click **"Continue"**
4. Autorizar AWS Amplify a acceder a tu GitHub
5. Seleccionar:
   - Repository: `happyhub` (o el nombre de tu repo)
   - Branch: `main`
6. Click **"Next"**

### 2.3. Configurar Build Settings

Amplify detectará Next.js automáticamente. Verifica la configuración:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

Click **"Next"**

### 2.4. Revisar y Crear

1. Revisar configuración
2. Click **"Save and deploy"**

**Amplify comenzará el primer build** (tarda 5-10 min).

---

## 🔐 Paso 3: Configurar Variables de Entorno

Mientras hace el primer build, configuramos variables:

### 3.1. En Amplify Console

1. Ve a tu app → **"Environment variables"** (menú izquierdo)
2. Click **"Manage variables"**
3. Añadir todas estas variables:

```
# Aurora PostgreSQL
DATABASE_URL = postgresql://dbadmin:c0MAkvDuZ6yWhfUUzgMh@happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com:5432/happyhub
DB_HOST = happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com
DB_PORT = 5432
DB_NAME = happyhub
DB_USER = dbadmin
DB_PASSWORD = YOUR_DB_PASSWORD

# AWS
AWS_REGION = eu-west-1
AWS_ACCESS_KEY_ID = YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY = YOUR_AWS_SECRET_ACCESS_KEY

# n8n (mantener URL actual o actualizar después)
N8N_WEBHOOK_URL = http://34.243.177.162:5678/webhook/reservation-request
NEXT_PUBLIC_N8N_WEBHOOK_URL = http://34.243.177.162:5678/webhook/reservation-request

# Stripe (copiar de tu .env actual)
STRIPE_SECRET_KEY = sk_test_xxxxx
STRIPE_WEBHOOK_SECRET = whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_xxxxx

# Auth
JWT_SECRET = tu-jwt-secret-aqui
NEXTAUTH_SECRET = tu-nextauth-secret-aqui
NEXTAUTH_URL = https://main.xxxxxx.amplifyapp.com (se actualiza después del primer deploy)
```

4. Click **"Save"**

### 3.2. Copiar Variables desde .env Actual

```bash
# Ver tus variables actuales
cat .env | grep -E "STRIPE|JWT|NEXTAUTH|N8N"
```

Copia los valores reales a Amplify.

---

## 🔄 Paso 4: Redeploy con Variables

1. El primer build probablemente falló (sin variables de entorno)
2. En Amplify Console: Click **"Redeploy this version"**
3. O: Push un cambio pequeño a GitHub para trigger nuevo build

Build tardará 5-10 minutos.

---

## 🗄️ Paso 5: Aplicar Schema Automáticamente

### 5.1. Actualizar init-db para Producción

El API route `/api/init-db` aplicará el schema automáticamente en el primer request.

O podemos crear un build hook que lo ejecute:

```bash
# En Amplify Build settings, añadir a preBuild:
- node -e "require('./src/lib/db').initializeSchema()"
```

### 5.2. Llamar Endpoint Después del Deploy

Una vez desplegado:

```bash
# Obtener URL de Amplify
AMPLIFY_URL="https://main.xxxxx.amplifyapp.com"

# Llamar init-db
curl $AMPLIFY_URL/api/init-db
```

Debería retornar:
```json
{
  "success": true,
  "message": "Database initialized successfully!"
}
```

---

## ✅ Paso 6: Verificación Post-Deploy

### 6.1. Probar la Aplicación

```bash
# Abrir app en navegador
open $AMPLIFY_URL
```

Navegar a:
- `/` - Home (debería cargar)
- `/servicios` - Servicios
- `/disponibilidad` - Calendario
- `/reservas` - Formulario de reserva

### 6.2. Probar Login

Ir a `/login` (si existe) o crear una reserva.

Usuarios demo:
- `admin@happyhub.es` / `happyhub123`
- `cliente@happyhub.es` / `happyhub123`

### 6.3. Verificar Base de Datos

En Amplify logs, deberías ver:
```
✅ Database schema already exists
```

O si es la primera vez:
```
📝 Creating database schema...
✅ Schema created
✅ Seed data inserted
```

---

## 🌐 Paso 7: Configurar Dominio Custom (Opcional)

Si tienes dominio propio:

1. En Amplify Console → **"Domain management"**
2. Click **"Add domain"**
3. Seguir wizard para:
   - happyhub.com
   - www.happyhub.com
4. AWS configurará SSL automáticamente

---

## 📊 Paso 8: Configurar CI/CD

### 8.1. Ya está configurado automáticamente!

Cada push a `main` en GitHub trigger auto-deploy.

### 8.2. Configurar Branch Environments (Opcional)

Para staging:
```bash
# Crear branch staging
git checkout -b staging
git push origin staging

# En Amplify Console, conectar branch staging
# Tendrás: main.xxx.amplifyapp.com (prod) y staging.xxx.amplifyapp.com (staging)
```

---

## 🐛 Troubleshooting

### Build falla con error de PostgreSQL

**Causa**: Variables de entorno no configuradas o incorrectas

**Solución**:
1. Verificar todas las variables DB_* en Environment variables
2. Redeploy

### Error: "Cannot connect to database"

**Causa**: Amplify no puede acceder a Aurora (network issue)

**Solución**:
- Verificar que Aurora y Amplify están en misma región (eu-west-1)
- Verificar security group permite conexiones desde VPC
- Contactar soporte AWS

### Error al aplicar schema

**Causa**: Schema con sintaxis PostgreSQL incompatible

**Solución**:
- Usar schema-simple.sql en vez de schema.sql completo
- Verificar logs de Amplify

---

## ✅ Checklist Fase 4

- [ ] Código pusheado a GitHub
- [ ] Amplify app creada y conectada a GitHub
- [ ] Variables de entorno configuradas
- [ ] Primer build exitoso
- [ ] Schema aplicado (via /api/init-db)
- [ ] Aplicación accesible públicamente
- [ ] Testing básico completado
- [ ] HTTPS funcionando

---

## ➡️ Siguiente Paso

Una vez completada Fase 4:

```bash
# Marcar como completada
echo "✅ Fase 4 completada: $(date)" >> migration/progress.log

# Continuar con Fase 5: Testing completo
cat migration/FASE_5_TESTING.md
```

---

**Listo para empezar con Amplify? Vamos!** 🚀
