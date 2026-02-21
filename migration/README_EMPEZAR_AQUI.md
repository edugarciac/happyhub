# 🚀 Guía de Migración HappyHub - EMPEZAR AQUÍ

**Última actualización**: 2025-02-18

---

## 📋 Resumen Ejecutivo

Vas a migrar HappyHub de Vercel+Airtable a AWS para:
- ✅ Aprovechar crédito AWS $1,000 (cubre 12 meses)
- ✅ Habilitar servicios AI (Bedrock, Rekognition)
- ✅ Mejor performance y escalabilidad
- ✅ Costes más bajos a largo plazo (67% ahorro en alto tráfico)

**Timeline**: 1-2 días (sin migración de datos de Airtable)

**Coste durante migración**: ~3€ total

**Coste post-migración**: 0€/mes (cubierto por crédito AWS durante año 1)

---

## ✅ Estado Actual

### Infraestructura AWS Existente
- ✅ **EC2 n8n-server**: Corriendo (IP: 34.243.177.162)
- ✅ **S3 Bucket**: happyhub-assets-prod (vacío)
- ✅ **AWS CLI**: Configurado con usuario happyhub-cli
- ✅ **Permisos IAM**: Verificados (S3, EC2, RDS)
- ✅ **VPC**: Default VPC en eu-west-1 lista

### Airtable
- ✅ **Sin datos**: No hay tablas con datos que migrar
- ✅ **Simplificación**: Creamos schema desde cero en PostgreSQL

### Pre-Flight Check
- **Tests pasados**: 9/10 (90%)
- **Único pendiente**: Instalar PostgreSQL client (fácil)

---

## 🗺️ Plan de Migración (Revisado)

| Fase | Descripción | Duración | Estado |
|------|-------------|----------|--------|
| ~~0~~ | ~~Backup Airtable~~ | ~~SKIP~~ | ✅ No necesario |
| **1** | **Crear Aurora PostgreSQL** | 2-3h | 📍 **PRÓXIMO PASO** |
| 2 | Actualizar n8n Workflows | 1-2h | ⏳ Pendiente |
| 3 | Actualizar Next.js App | 2-3h | ⏳ Pendiente |
| 4 | Deploy a AWS Amplify | 2-3h | ⏳ Pendiente |
| 5 | Testing y Go Live | 1-2h | ⏳ Pendiente |

**Total**: 8-13 horas de trabajo

---

## 🎯 Fase 1: Crear Aurora PostgreSQL (PRÓXIMO PASO)

### Archivos Preparados

Todos los archivos necesarios ya están listos:

```
migration/
├── FASE_1_AURORA.md          ← 📖 Guía paso a paso (LEER PRIMERO)
├── schema.sql                 ← 🗄️ Schema completo de base de datos
├── seed-data.sql              ← 🌱 Datos iniciales (usuarios, tipos evento)
├── pre-flight-check.sh        ← ✅ Verificación de requisitos
└── STATUS.md                  ← 📊 Estado actual de migración
```

### ¿Qué vas a hacer?

1. **Instalar PostgreSQL client** (5 min)
   ```bash
   brew install postgresql@15
   ```

2. **Ejecutar guía Fase 1** (2-3 horas)
   ```bash
   # Abrir guía
   open migration/FASE_1_AURORA.md

   # O leer en terminal
   cat migration/FASE_1_AURORA.md | less
   ```

3. **Resultado**: Aurora PostgreSQL corriendo con todas las tablas y datos demo

---

## 📚 Documentación Disponible

### Guías de Migración
- **`migration/FASE_1_AURORA.md`** - Crear base de datos PostgreSQL ← **EMPEZAR AQUÍ**
- **`migration/STATUS.md`** - Estado actual y progreso
- **`migration/pre-flight-check.sh`** - Verificar requisitos

### Documentación de Referencia
- **`docs/aws/PLAN_MIGRACION_A_AWS.md`** - Plan completo de migración
- **`docs/aws/COMPARACION_COSTES_TRAFICO.md`** - Análisis de costes detallado
- **`docs/aws/AWS_CURRENT_INFRASTRUCTURE.md`** - Infraestructura actual
- **`docs/aws/AWS_CLI_CREDENTIALS.md`** - Credenciales AWS CLI
- **`docs/aws/AWS_IAM_PERMISSIONS.md`** - Permisos IAM

### Scripts de Ayuda
- **`./migration/pre-flight-check.sh`** - Verificar que estás listo
- **`./scripts/migration-checklist.sh`** - Checklist interactivo completo
- **`./scripts/list-aws-resources.sh`** - Ver recursos AWS actuales

---

## 🎬 Comenzar Ahora

### Opción 1: Lectura Rápida

```bash
# 1. Instalar PostgreSQL client
brew install postgresql@15

# 2. Verificar que todo está listo
./migration/pre-flight-check.sh

# 3. Abrir guía Fase 1
open migration/FASE_1_AURORA.md
```

### Opción 2: Lectura Completa

```bash
# 1. Entender el plan completo
open docs/aws/PLAN_MIGRACION_A_AWS.md

# 2. Ver análisis de costes
open docs/aws/COMPARACION_COSTES_TRAFICO.md

# 3. Verificar requisitos
./migration/pre-flight-check.sh

# 4. Empezar Fase 1
open migration/FASE_1_AURORA.md
```

---

## 💡 Información Importante

### ⚠️ Antes de Empezar

1. **Tiempo requerido**: Bloquea 2-3 horas para Fase 1
2. **Conexión estable**: Necesitas buena conexión a internet
3. **Crédito AWS activo**: Verifica que tu crédito $1,000 está activo
4. **No hay vuelta atrás crítica**: Pero puedes eliminar Aurora si algo falla

### 💰 Costes Durante Migración

- **Fase 1** (Aurora): ~1€/día mientras pruebas
- **Total migración**: ~3€ (2-3 días)
- **Post-migración**: 0€/mes (crédito AWS cubre todo el año 1)

### 🛡️ Seguridad

- ✅ Todos los archivos con passwords están en `.gitignore`
- ✅ Connection strings se guardan en `migration/.db-password` (chmod 600)
- ✅ No subas archivos de `migration/` a GitHub

### 🆘 Si Algo Sale Mal

1. **Consulta Troubleshooting** en cada guía de fase
2. **Revisa logs** en CloudWatch (AWS Console)
3. **Rollback**: Puedes eliminar Aurora sin problemas:
   ```bash
   aws --profile happyhub-cli rds delete-db-cluster \
     --db-cluster-identifier happyhub-db-cluster \
     --skip-final-snapshot --region eu-west-1
   ```

---

## 📊 Lo Que Hemos Logrado Hasta Ahora

### ✅ Fase 0 Completada (Skip)
- Verificado que Airtable está vacío
- No necesitamos backup ni migración de datos
- Schema creado desde cero

### ✅ Preparación Completada
- AWS CLI configurado
- Permisos IAM verificados
- Schema SQL listo (`migration/schema.sql`)
- Seed data preparado (`migration/seed-data.sql`)
- Scripts helper creados
- Documentación completa

### 📍 Estás Aquí
**Listo para Fase 1**: Crear Aurora PostgreSQL

---

## 🎯 Objetivos de Fase 1

Al completar Fase 1 tendrás:

- ✅ Cluster Aurora Serverless v2 corriendo
- ✅ Base de datos `happyhub` creada
- ✅ 5 tablas creadas (users, reservations, providers, services, event_types)
- ✅ Usuarios demo insertados (admin, cliente, proveedor)
- ✅ Tipos de evento predefinidos (11 tipos)
- ✅ Proveedores demo insertados (14 proveedores)
- ✅ Conexión verificada desde tu Mac
- ✅ Variables de entorno actualizadas

**Tiempo**: 2-3 horas
**Coste**: ~1€/día (0€ con crédito)

---

## ➡️ SIGUIENTE PASO INMEDIATO

```bash
# 1. Instalar PostgreSQL client (si no lo tienes)
brew install postgresql@15

# 2. Abrir guía de Fase 1
open migration/FASE_1_AURORA.md

# 3. Seguir instrucciones paso a paso
```

---

## 📞 Preguntas Frecuentes

**P: ¿Cuánto tiempo toma toda la migración?**
R: 1-2 días de trabajo efectivo (8-13 horas totales).

**P: ¿Puedo hacerlo en fines de semana?**
R: Sí, perfecto. Sábado: Fase 1-2. Domingo: Fase 3-5.

**P: ¿Qué pasa si algo falla?**
R: Puedes eliminar los recursos AWS sin problemas. No hay datos críticos que perder.

**P: ¿Necesito conocimientos de AWS?**
R: No necesariamente. Las guías son paso a paso con comandos exactos.

**P: ¿Cuándo veré el cobro de AWS?**
R: A final de mes, pero cubierto por crédito $1,000 durante año 1.

**P: ¿Puedo pausar la migración?**
R: Sí, puedes parar después de cada fase. Solo pagarás por recursos activos (~1€/día Aurora).

---

## 🎉 ¡Vamos!

¡Estás listo para empezar! La migración será más rápida de lo que piensas porque:
- ✅ No hay datos que migrar de Airtable
- ✅ Infraestructura AWS ya parcialmente desplegada
- ✅ Todos los archivos y scripts preparados
- ✅ Documentación detallada paso a paso

**¡Abre `migration/FASE_1_AURORA.md` y comienza!** 🚀

---

*Última actualización: 2025-02-18*
*Versión: 1.0*
