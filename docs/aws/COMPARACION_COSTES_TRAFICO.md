# Comparación de Costes: Vercel+Airtable vs AWS

Análisis detallado de costes en 3 escenarios de tráfico para HappyHub.

**Última actualización**: 2025-02-18

---

## 📊 Escenarios Analizados

### Escenario 1: Bajo Tráfico (Startup/MVP)
- **Eventos/mes**: 5-10
- **Visitas/mes**: 1,000-2,000
- **Usuarios registrados**: 20-50
- **Base de datos**: ~500 registros
- **Storage**: ~5 GB (fotos/documentos)
- **Bandwidth**: ~10 GB/mes

### Escenario 2: Tráfico Medio (Crecimiento)
- **Eventos/mes**: 30-40
- **Visitas/mes**: 10,000-15,000
- **Usuarios registrados**: 200-500
- **Base de datos**: ~3,000 registros
- **Storage**: ~50 GB
- **Bandwidth**: ~100 GB/mes

### Escenario 3: Alto Tráfico (Escala)
- **Eventos/mes**: 100+
- **Visitas/mes**: 50,000+
- **Usuarios registrados**: 2,000+
- **Base de datos**: ~15,000 registros
- **Storage**: ~200 GB
- **Bandwidth**: ~500 GB/mes

---

## 💰 Escenario 1: BAJO TRÁFICO (Startup/MVP)

### Opción A: Vercel + Airtable

| Servicio | Plan | Coste/mes | Notas |
|----------|------|-----------|-------|
| **Vercel** | Pro | 20€ | - 100 GB bandwidth<br>- Funciones serverless ilimitadas<br>- Build minutes ilimitados<br>- Web analytics |
| **Airtable** | Plus | 10€ | - 5,000 registros/base<br>- 5 GB attachments<br>- 6 meses historia<br>- API rate: 5 req/seg |
| **n8n** | Self-hosted | 0€ | - Hosting externo requerido |
| **Total** | | **30€/mes** | **360€/año** |

**Límites alcanzados con este tráfico:**
- ✅ Bandwidth: 10 GB usado / 100 GB incluido (10%)
- ✅ Registros: 500 / 5,000 (10%)
- ✅ Storage: 5 GB / 5 GB (100%) ⚠️ **Límite alcanzado**

### Opción B: AWS

| Servicio | Configuración | Coste/mes | Notas |
|----------|---------------|-----------|-------|
| **Amplify** | Hosting + CDN | 5€ | - 5 GB storage<br>- 15 GB transferencia<br>- 1,000 build minutes |
| **Aurora** | Serverless v2<br>0.5-1 ACU | 15€ | - Min 0.5 ACU (idle)<br>- Escala automático<br>- Backups incluidos |
| **EC2 n8n** | t3.micro | 8€ | - Ya desplegado<br>- 2 vCPU, 1 GB RAM |
| **S3** | 5 GB | 0.12€ | - $0.023/GB<br>- Primeros 5 GB gratis (new accounts) |
| **CloudFront** | 10 GB transfer | 0.85€ | - Primeros 1 TB: $0.085/GB |
| **Route 53** | Hosted zone | 0.50€ | - DNS management |
| **Total** | | **29.47€/mes** | **353€/año** |

**Capacidad con este tráfico:**
- ✅ Todas las métricas muy por debajo de límites
- ✅ Aurora escala automáticamente según carga
- ✅ S3/CloudFront sin límites prácticos

### 🏆 Ganador Escenario 1: **EMPATE TÉCNICO**

**Vercel+Airtable**:
- ✅ Setup más rápido (0 configuración infraestructura)
- ✅ Less devops overhead
- ⚠️ Storage limit alcanzado (necesitas upgrade a Pro: +10€)
- ❌ Sin acceso a servicios AI

**AWS**:
- ✅ Storage ilimitado
- ✅ Preparado para escalar sin cambios
- ✅ Acceso a Bedrock, Rekognition, SES
- ❌ Más complejidad inicial
- ❌ Requiere conocimiento AWS

**Coste real ajustado:**
- **Vercel+Airtable**: 40€/mes (con Airtable Pro para más storage)
- **AWS**: 30€/mes

**Recomendación**: Si solo necesitas MVP rápido → Vercel+Airtable. Si planeas features AI o escalar → AWS.

---

## 💰 Escenario 2: TRÁFICO MEDIO (Crecimiento)

### Opción A: Vercel + Airtable

| Servicio | Plan | Coste/mes | Notas |
|----------|------|-----------|-------|
| **Vercel** | Pro | 20€ | - 100 GB bandwidth ✅<br>- Suficiente para 15K visitas |
| **Airtable** | **Pro** | **20€** | - **50,000 registros** ✅<br>- **20 GB attachments**<br>- 100,000 API calls/mes<br>- API rate: 5 req/seg |
| **Total** | | **40€/mes** | **480€/año** |

**Upgrade necesario**: Airtable Plus → Pro (+10€)

**Límites alcanzados:**
- ✅ Bandwidth: 100 GB usado / 100 GB incluido (100%) ⚠️ **En el límite**
- ✅ Registros: 3,000 / 50,000 (6%)
- ✅ Storage: 50 GB / 20 GB (250%) ❌ **Límite superado**

**Problema**: Storage de Airtable insuficiente (20 GB < 50 GB necesario)

**Solución**: Usar Airtable Pro + S3 externo para media → +5€/mes S3 = **45€/mes**

### Opción B: AWS

| Servicio | Configuración | Coste/mes | Notas |
|----------|---------------|-----------|-------|
| **Amplify** | Hosting + CDN | 15€ | - 50 GB storage<br>- 100 GB transferencia<br>- 1,000 build minutes |
| **Aurora** | Serverless v2<br>0.5-2 ACU | 25€ | - Escala según carga<br>- ~40 GB storage<br>- Backups automáticos |
| **EC2 n8n** | t3.micro | 8€ | - Ya desplegado |
| **S3** | 50 GB | 1.15€ | - $0.023/GB |
| **CloudFront** | 100 GB | 8.50€ | - $0.085/GB |
| **Route 53** | Hosted zone | 0.50€ | - DNS |
| **Total** | | **58.15€/mes** | **698€/año** |

**Capacidad con este tráfico:**
- ✅ Todas las métricas cómodas
- ✅ Margen para picos de tráfico

### 🏆 Ganador Escenario 2: **VERCEL+AIRTABLE (con S3)**

**Vercel+Airtable** (45€/mes):
- ✅ Más económico
- ✅ Menos gestión
- ⚠️ Arquitectura híbrida (Airtable + S3 externo)
- ⚠️ En el límite de bandwidth

**AWS** (58€/mes):
- ✅ Arquitectura unificada
- ✅ Más margen para crecer
- ✅ Servicios AI disponibles
- ❌ +29% más caro

**Diferencia**: AWS cuesta +13€/mes (+29%)

**Recomendación**:
- Si presupuesto es crítico → **Vercel+Airtable+S3** (45€)
- Si planeas usar IA o crecer más → **AWS** (58€)

---

## 💰 Escenario 3: ALTO TRÁFICO (Escala)

### Opción A: Vercel + Airtable

| Servicio | Plan | Coste/mes | Notas |
|----------|------|-----------|-------|
| **Vercel** | **Enterprise** | **Desde 400€** | - Bandwidth ilimitado<br>- DDoS protection<br>- SLA 99.99%<br>- Custom contracts |
| **Airtable** | **Enterprise** | **Custom** | - +100,000 registros<br>- Unlimited API calls<br>- Pricing: Desde 100€/mes |
| **S3 externo** | 200 GB | 5€ | - Para media storage |
| **Total estimado** | | **~500-600€/mes** | **6,000-7,200€/año** |

**Nota**: Pricing Enterprise es bajo contrato, estimaciones basadas en rangos públicos.

**Problemas en este escenario:**
- ❌ Vercel Enterprise muy caro para startup
- ❌ Airtable no diseñado para este volumen
- ❌ Performance degradada con 15K+ registros en Airtable
- ❌ Sin servicios AI nativos

### Opción B: AWS

| Servicio | Configuración | Coste/mes | Notas |
|----------|---------------|-----------|-------|
| **Amplify** | Hosting + CDN | 50€ | - 200 GB storage<br>- 500 GB transferencia |
| **Aurora** | Serverless v2<br>1-4 ACU | 60€ | - Escala hasta 4 ACU<br>- ~150 GB storage<br>- Performance optimizada |
| **EC2 n8n** | **t3.small** | 15€ | - Upgrade por carga<br>- 2 vCPU, 2 GB RAM |
| **S3** | 200 GB | 4.60€ | - $0.023/GB |
| **CloudFront** | 500 GB | 42.50€ | - $0.085/GB<br>- Edge caching |
| **Route 53** | Hosted zone | 0.50€ | - DNS |
| **Lambda** | 1M invocations | 0.20€ | - Image processing |
| **SES** | 10K emails | 1€ | - Transactional emails |
| **Rekognition** | 1K images | 10€ | - Photo analysis (opcional) |
| **Total** | | **183.80€/mes** | **2,206€/año** |

**Con Bedrock AI (opcional)**:
- Claude 3 Haiku: +15€/mes (50K requests)
- **Total con AI**: **198.80€/mes** (2,386€/año)

**Capacidad con este tráfico:**
- ✅ Todas las métricas confortables
- ✅ Picos de tráfico manejados automáticamente
- ✅ Performance óptima en base de datos

### 🏆 Ganador Escenario 3: **AWS POR GOLEADA**

**Vercel+Airtable** (500-600€/mes):
- ❌ 3x más caro que AWS
- ❌ Performance cuestionable con este volumen
- ❌ Sin servicios AI
- ❌ Arquitectura no diseñada para esta escala

**AWS** (184-199€/mes):
- ✅ 66% más barato
- ✅ Performance excelente (Aurora, CloudFront)
- ✅ Servicios AI incluidos (Bedrock, Rekognition)
- ✅ Arquitectura diseñada para escala
- ✅ SLA 99.99% con multi-AZ

**Diferencia**: AWS ahorra **316-401€/mes** (63-67% más barato)

**Ahorro anual**: **3,792-4,812€/año**

**Recomendación**: A esta escala, AWS es obviamente superior técnica y económicamente.

---

## 📊 Resumen Comparativo

### Tabla de Costes por Escenario

| Escenario | Vercel+Airtable | AWS | Diferencia | Ganador |
|-----------|-----------------|-----|------------|---------|
| **Bajo Tráfico** | 40€/mes | 30€/mes | AWS -25% | 🟡 Empate |
| **Medio Tráfico** | 45€/mes | 58€/mes | Vercel -22% | 🟢 Vercel |
| **Alto Tráfico** | 550€/mes | 184€/mes | AWS -67% | 🔵 AWS |

### Gráfica de Costes

```
Coste (€/mes)
600 |                                             ● Vercel+Airtable
    |                                           ╱
550 |                                         ╱
    |                                       ╱
500 |                                     ╱
    |                                   ╱
    |                                 ╱
200 |                               ╱             ● AWS
    |                             ╱             ╱
184 |                           ╱             ╱
    |                         ╱             ╱
100 |                       ╱             ╱
    |                     ╱             ╱
 58 |                   ╱     ● AWS  ╱
 45 |         ● Vercel╱           ╱
 40 |       ╱       ╱           ╱
 30 | ● AWS       ╱           ╱
    |___________╱___________╱_________________
      Bajo      Medio      Alto
      Tráfico   Tráfico    Tráfico
```

### Punto de Inflexión

**Break-even**: ~35-40 eventos/mes (~12,000 visitas/mes)

- **Antes del break-even**: Vercel+Airtable más económico
- **Después del break-even**: AWS más económico

---

## 🎯 Análisis por Factor

### 1. Coste Puro

**Ganador por escenario:**
- Bajo: **AWS** (-25%)
- Medio: **Vercel** (-22%)
- Alto: **AWS** (-67%)

**Recomendación**: Si proyectas crecer a +50K visitas/mes → AWS. Si te quedas en <15K visitas/mes → Vercel.

### 2. Performance

| Factor | Vercel+Airtable | AWS |
|--------|-----------------|-----|
| **Latencia API** | ~200-300ms (Airtable) | ~50-100ms (Aurora) |
| **Uptime** | 99.9% (Vercel Pro) | 99.99% (Multi-AZ Aurora) |
| **CDN** | CloudFlare (Vercel) | CloudFront (AWS) |
| **Database scaling** | Manual upgrade | Automático (Serverless) |

**Ganador**: **AWS** en alto tráfico, **empate** en bajo/medio tráfico.

### 3. Features

| Feature | Vercel+Airtable | AWS |
|---------|-----------------|-----|
| **AI/ML** | ❌ No nativo | ✅ Bedrock, Rekognition |
| **Email** | ❌ Externo (SendGrid) | ✅ SES nativo |
| **Image processing** | ❌ Externo | ✅ Lambda + S3 |
| **Search** | ⚠️ Limitado | ✅ Full-text nativo |
| **Analytics** | ✅ Vercel Analytics | ⚠️ Requiere CloudWatch |
| **Backups** | ⚠️ Manual | ✅ Automáticos |

**Ganador**: **AWS** para features avanzadas, **Vercel** para simplicidad.

### 4. DevOps Overhead

| Tarea | Vercel+Airtable | AWS |
|-------|-----------------|-----|
| **Setup inicial** | 1 hora | 1-2 días |
| **Mantenimiento/mes** | 1-2 horas | 4-6 horas |
| **Conocimiento requerido** | Básico | Intermedio-Avanzado |
| **Monitoreo** | Incluido | Requiere configurar |
| **Debugging** | Fácil | Más complejo |

**Ganador**: **Vercel** en simplicidad, **AWS** en control.

### 5. Lock-in Vendor

**Vercel+Airtable**:
- ⚠️ Lock-in muy fuerte (especialmente Airtable)
- ⚠️ Migración futura muy compleja
- ⚠️ Airtable no tiene export SQL directo

**AWS**:
- ⚠️ Lock-in moderado
- ✅ Aurora compatible con PostgreSQL estándar
- ✅ Migración a otros providers más factible

**Ganador**: **AWS** (menor lock-in).

---

## 💡 Recomendación Final por Caso de Uso

### Caso 1: MVP Rápido (0-3 meses)
**Recomendado**: **Vercel + Airtable**

**Por qué:**
- ✅ Setup en 1 hora vs 2 días
- ✅ Enfoque en producto, no infraestructura
- ✅ Coste predecible
- ✅ Fácil de cambiar luego

**Cuando migrar a AWS**: Cuando llegues a 30+ eventos/mes o necesites features AI.

### Caso 2: Startup con Tracción (3-12 meses)
**Recomendado**: **AWS**

**Por qué:**
- ✅ Preparado para crecer sin re-arquitecturar
- ✅ Features AI dan ventaja competitiva
- ✅ Costes escalan linealmente
- ✅ Performance mejor con crecimiento

**Coste**: 30-60€/mes, manejable para startup con ingresos.

### Caso 3: Negocio Escalado (12+ meses)
**Recomendado**: **AWS** (obligatorio)

**Por qué:**
- ✅ 67% más barato que Vercel Enterprise
- ✅ Performance crítica en este volumen
- ✅ Airtable no diseñado para esta escala
- ✅ Features enterprise incluidas

**Coste**: 180-200€/mes, rentable con 100+ eventos/mes.

---

## 🔮 Escenario HappyHub Específico

### Proyección Año 1-2 (Tu caso)

**Mes 1-3**: 5-10 eventos/mes (Bajo tráfico)
- **Recomendado inicial**: Vercel + Airtable
- **Coste**: 40€/mes

**Mes 4-9**: 20-40 eventos/mes (Medio tráfico)
- **Punto de migración a AWS**
- **Coste**: 58€/mes AWS

**Mes 10-12**: 40-60 eventos/mes
- **Coste AWS**: 70-80€/mes

**Año 2 (objetivo: 5 locales × 30 eventos)**: 150 eventos/mes
- **Coste AWS**: ~200€/mes
- **Coste Vercel**: ~600-700€/mes
- **Ahorro AWS**: 400-500€/mes

### Valor Añadido AWS para HappyHub

**Features AI que justifican AWS:**

1. **AI Event Assistant** (Bedrock Claude)
   - Precio servicio: 50€/evento
   - Coste Bedrock: ~0.50€/evento
   - Margen: 49.50€ × 40 eventos = **1,980€/mes**

2. **Smart Photocall** (Rekognition)
   - Precio servicio: 120€/evento
   - Coste Rekognition: ~2€/evento
   - Margen: 118€ × 20 eventos = **2,360€/mes**

3. **Cloud Memory Vault** (S3)
   - Precio servicio: 30€/evento
   - Coste S3: ~0.10€/evento
   - Margen: 29.90€ × 40 eventos = **1,196€/mes**

**Total ingreso potencial servicios digitales**: **5,536€/mes**

**Coste infraestructura AWS**: **70-80€/mes**

**ROI**: **69:1** (6,900% return)

---

## 🎓 Conclusión Estratégica

### Para HappyHub, la decisión depende de tu estrategia:

**Opción 1: Validar Product-Market Fit Rápido**
- **Stack**: Vercel + Airtable
- **Timeline**: 0-6 meses
- **Coste**: 40€/mes
- **Objetivo**: Cerrar primeros 10-20 clientes
- **Migrar a AWS cuando**: Llegues a 30 eventos/mes O quieras lanzar servicios digitales AI

**Opción 2: Lanzamiento con Diferenciación AI (Recomendado)**
- **Stack**: AWS desde día 1
- **Timeline**: 0-12 meses
- **Coste inicial**: 30€/mes → 80€/mes (mes 12)
- **Objetivo**: Posicionarte como "tech-enabled venue", no solo "espacio de eventos"
- **Ventaja**: Servicios digitales premium desde el inicio

### Mi Recomendación Personal

Dado que:
1. Ya tienes crédito AWS $1,000 activo
2. Ya tienes n8n corriendo en AWS
3. Tienes skills técnicos para gestionar AWS
4. Los servicios digitales AI son tu diferenciador clave

**Recomiendo: Migrar a AWS ahora** ✅

**Razones:**
- Crédito AWS cubre 12 meses completos
- Evitas re-arquitecturar en 6 meses
- Puedes lanzar servicios AI desde día 1 (ventaja competitiva)
- El esfuerzo de migración es el mismo ahora que dentro de 6 meses
- Con 30-40 eventos/mes, AWS será más barato Y mejor

**Plan sugerido:**
1. **Semana 1**: Backup todo, crear Aurora, migrar datos
2. **Semana 2**: Desplegar Amplify, configurar S3/CloudFront
3. **Semana 3**: Testing + Go live
4. **Mes 2-3**: Implementar features AI (Bedrock, Rekognition)

**Coste durante crédito**: 0€/mes (cubierto por crédito $1,000)
**Coste post-crédito**: 30-80€/mes según crecimiento

---

## 📞 Siguiente Paso

¿Quieres que empecemos con la migración? Puedo ayudarte con:

1. **Fase 0**: Backup Airtable y preparación
2. **Fase 1**: Setup Aurora PostgreSQL
3. **Configurar Amplify** para Next.js

O prefieres quedarte en Vercel algunos meses más y migrar cuando tengas más tracción?
