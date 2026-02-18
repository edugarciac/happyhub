# HappyHub Documentation

Documentation organizada por categorías para facilitar el desarrollo y despliegue de HappyHub.

## 📂 Estructura de Carpetas

### `/airtable/`
Documentación sobre configuración y gestión de Airtable:
- **AIRTABLE_SETUP.md** - Configuración inicial de base de datos Airtable
- **AIRTABLE_CAMPO_UPDATES.md** - Actualizaciones de campos en Airtable
- **ACTUALIZAR_AIRTABLE_TIPOS_EVENTO.md** - Gestión de tipos de eventos

### `/aws/`
Guías de configuración de AWS para hosting y servicios:
- **COMPARACION_COSTES_TRAFICO.md** - 💰 Análisis detallado de costes Vercel vs AWS por tráfico
- **PLAN_MIGRACION_A_AWS.md** - 🚀 Plan completo de migración Vercel+Airtable → AWS
- **AWS_CURRENT_INFRASTRUCTURE.md** - 📊 Estado actual de la infraestructura AWS desplegada
- **AWS_CLI_CREDENTIALS.md** - Configuración de credenciales AWS CLI (happyhub-cli user)
- **AWS_IAM_PERMISSIONS.md** - Configuración de permisos IAM para usuarios AWS
- **AWS_QUICK_START.md** - Inicio rápido para desplegar en AWS
- **AWS_SETUP_PASO_A_PASO.md** - Guía detallada paso a paso
- **AWS_SETUP_GUIDE.md** - Guía completa de configuración
- **AWS_SETUP_COMPLETADO.md** - Checklist de configuración completada

### `/n8n/`
Documentación de flujos de automatización n8n:
- **IMPORTAR_N8N_AHORA.md** - Guía rápida de importación de workflows (10 minutos)
- **N8N_IMPORT_GUIDE.md** - Guía detallada de importación
- **TROUBLESHOOTING_N8N_CALENDAR.md** - Solución de problemas con Google Calendar

### `/deployment/`
Guías de despliegue y configuración de producción:
- **DEPLOYMENT_CHECKLIST.md** - Checklist completo pre-despliegue
- **VERCEL_ENV_SETUP.md** - Configuración de variables de entorno en Vercel

### `/project_notes/`
Sistema de memoria del proyecto (usado por Claude Code):
- **bugs.md** - Log de bugs con soluciones
- **decisions.md** - Decisiones arquitectónicas (ADRs)
- **key_facts.md** - Configuración, credenciales, URLs importantes
- **issues.md** - Log de trabajo con tickets

## 📄 Documentos en Raíz

- **CHANGELOG_DISPONIBILIDAD.md** - Historial de cambios en sistema de disponibilidad
- **IMPLEMENTACION_COMPLETA.md** - Documentación de implementación completa
- **MODELO_REALISTA_FINAL.md** - Modelo de negocio y precios
- **HAPPYHUB_ONE_PAGER.md** - Resumen ejecutivo del proyecto

## 🔗 Enlaces Rápidos

### Setup Inicial
1. Leer [AWS Quick Start](aws/AWS_QUICK_START.md)
2. Configurar [Airtable](airtable/AIRTABLE_SETUP.md)
3. Importar [workflows n8n](n8n/IMPORTAR_N8N_AHORA.md)

### Deployment
1. Revisar [Deployment Checklist](deployment/DEPLOYMENT_CHECKLIST.md)
2. Configurar [Vercel Environment](deployment/VERCEL_ENV_SETUP.md)

### Troubleshooting
- [n8n Calendar Issues](n8n/TROUBLESHOOTING_N8N_CALENDAR.md)
- [Bugs Log](project_notes/bugs.md)

## 🔐 Archivos de Credenciales

Los siguientes archivos contienen credenciales y **NUNCA deben subirse a GitHub**:
- `.env` - Variables de entorno locales
- `.env.local` - Credenciales AWS y otros secretos
- `airtable-credentials.json` - API keys de Airtable
- `aws-credentials.json` - Credenciales AWS
- `aws-credentials-happyhub.json` - Credenciales específicas del proyecto

Estos archivos están protegidos por `.gitignore`.

## 📝 Cómo Contribuir

Al agregar nueva documentación:
1. Clasifica el documento en la carpeta apropiada
2. Actualiza este README.md con el nuevo archivo
3. Usa nombres descriptivos en UPPERCASE para documentos de configuración
4. Mantén formato Markdown consistente
