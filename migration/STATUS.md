# Estado de Migración HappyHub

**Fecha de inicio**: 2025-02-18

---

## ✅ Descubrimientos Iniciales

### Airtable Status
- **Estado**: Sin datos (tablas vacías o no creadas)
- **Conclusión**: No necesitamos migración de datos, solo crear schema nuevo
- **Impacto**: Migración MUCHO más simple

### Infraestructura AWS Existente
- ✅ **EC2 n8n-server**: Corriendo (i-00e6ad6229322f4f3, IP: 34.243.177.162)
- ✅ **S3 Bucket**: happyhub-assets-prod (vacío)
- ❌ **Aurora PostgreSQL**: No creado aún
- ❌ **Amplify**: No desplegado

---

## 📋 Plan Actualizado (Sin Migración de Datos)

### ~~Fase 0: Backup de Airtable~~ ✅ SKIP
**Razón**: No hay datos que backupear

### Fase 1: Crear Aurora PostgreSQL ← **PRÓXIMO PASO**
**Duración**: 2-3 horas
**Tareas**:
1. Crear Aurora Serverless v2 cluster
2. Aplicar schema PostgreSQL inicial
3. Insertar datos de ejemplo (demo users, event types)
4. Configurar security groups
5. Verificar conexión desde local

### Fase 2: Actualizar n8n Workflows
**Duración**: 1-2 horas
**Tareas**:
1. Acceder a n8n UI (http://34.243.177.162:5678)
2. Reemplazar nodos Airtable por PostgreSQL
3. Configurar credenciales PostgreSQL
4. Probar workflow de reserva

### Fase 3: Actualizar Next.js App
**Duración**: 2-3 horas
**Tareas**:
1. Instalar `pg` (PostgreSQL client)
2. Crear `src/lib/db.ts` con pool de conexiones
3. Reemplazar llamadas a Airtable por queries SQL
4. Actualizar API routes
5. Testing local

### Fase 4: Deploy a AWS Amplify
**Duración**: 2-3 horas
**Tareas**:
1. Configurar Amplify desde consola AWS
2. Conectar repo GitHub
3. Configurar variables de entorno
4. Deploy automático
5. Verificar funcionamiento

### Fase 5: Testing y Go Live
**Duración**: 1-2 horas
**Tareas**:
1. Testing completo en producción
2. Primera reserva real
3. Monitoreo de errores
4. Ajustes finales

---

## ⏱️ Timeline Revisado

**Antes** (con migración de datos): 3 semanas
**Ahora** (sin migración): **1-2 días** 🚀

**Breakdown**:
- **Hoy (tarde)**: Fase 1 - Crear Aurora (2-3h)
- **Mañana**: Fase 2-3 - n8n + Next.js (4-5h)
- **Pasado mañana**: Fase 4-5 - Deploy + Testing (3-4h)

---

## 💰 Coste Durante Migración

**Durante desarrollo/testing**:
- Aurora (0.5 ACU mínimo): ~1€/día
- Amplify (staging): ~0.50€/día
- EC2 n8n: ~0.27€/día (ya corriendo)
- **Total**: ~1.77€/día

**Coste estimado migración completa**: ~3.50€

**Después de migración (producción)**:
- Aurora: ~25€/mes
- Amplify: ~12€/mes
- EC2 n8n: ~8€/mes
- S3 + CloudFront: ~5€/mes
- **Total**: ~50€/mes → **0€ con crédito AWS**

---

## 🎯 Ventajas del Enfoque "Clean Start"

✅ **Sin riesgo de pérdida de datos** (no hay datos que perder)
✅ **Schema optimizado** desde día 1 (no herencias de Airtable)
✅ **Migración más rápida** (1-2 días vs 3 semanas)
✅ **Sin downtime** (no hay producción activa)
✅ **Testing más simple** (empezar desde cero)
✅ **Arquitectura limpia** (diseño PostgreSQL nativo)

---

## 📝 Decisiones Tomadas

### 1. Skip Airtable Backup
**Razón**: No hay datos en Airtable
**Fecha**: 2025-02-18
**Impacto**: Acelera migración

### 2. Priorizar Aurora Serverless v2
**Razón**: Escala automático, ideal para empezar
**Alternativa rechazada**: RDS PostgreSQL estándar
**Coste**: ~25€/mes vs ~50€/mes RDS

### 3. Usar Amplify en vez de EC2 para Next.js
**Razón**: Setup más rápido, CI/CD automático
**Alternativa**: EC2 + NGINX (más control pero más trabajo)
**Coste**: ~12€/mes Amplify vs ~15€/mes EC2

---

## ➡️ Próxima Acción Inmediata

```bash
# Abrir guía de Fase 1
open migration/FASE_1_AURORA.md

# O empezar directamente con Aurora
aws --profile happyhub-cli rds describe-db-clusters --region eu-west-1
```

---

## 🎓 Lecciones Aprendidas

1. **Siempre verificar estado actual antes de planear migración**
   - Habríamos perdido tiempo haciendo backup innecesario

2. **Clean start es más rápido que migración**
   - 1-2 días vs 3 semanas

3. **Infraestructura AWS ya parcialmente lista**
   - EC2 n8n corriendo
   - S3 bucket creado
   - Solo falta Aurora + Amplify

---

## 📊 Progreso

```
Fase 0: Backup Airtable    [████████████████████] 100% ✅ SKIP
Fase 1: Aurora PostgreSQL  [░░░░░░░░░░░░░░░░░░░░]   0% ← AQUÍ
Fase 2: n8n Workflows      [░░░░░░░░░░░░░░░░░░░░]   0%
Fase 3: Next.js App        [░░░░░░░░░░░░░░░░░░░░]   0%
Fase 4: Deploy Amplify     [░░░░░░░░░░░░░░░░░░░░]   0%
Fase 5: Testing & Go Live  [░░░░░░░░░░░░░░░░░░░░]   0%
```

**Progreso total**: 16% (1/6 fases)
