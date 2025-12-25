# AWS Quick Start - HappyHub

**Créditos:** $1,000 USD | **Account ID:** 128959995116 | **Usuario:** edugarciac

---

## ⚡ Inicio Rápido (5 minutos)

### 1. Crear IAM User

```bash
# Ir a: https://console.aws.amazon.com/iam/
# Users → Add users → happyhub-cli
# ✅ Programmatic access
# ✅ AdministratorAccess (temporal)
# Copiar Access Key ID y Secret Access Key
```

### 2. Configurar AWS CLI

```bash
cd /Users/e.garcia.casas/Code/happyhub
./scripts/configure-aws.sh
# Seguir instrucciones
```

### 3. Configurar Billing Alerts (CRÍTICO)

```bash
# Ir a: https://console.aws.amazon.com/billing/home#/preferences
# ✅ Activar "Receive Billing Alerts"
# ✅ Activar "Receive Free Tier Usage Alerts"
```

### 4. Configurar n8n

```
1. Ir a: https://n8n-n8n.ljmvxa.easypanel.host
2. Settings → Credentials → Add → AWS
3. Pegar Access Key ID y Secret Access Key
4. Region: us-east-1
5. Guardar como: "AWS HappyHub"
```

---

## 📊 Arquitectura Propuesta

```
Frontend (Vercel FREE)
    ↓
API Gateway + Lambda ($5/mes)
    ↓
Aurora PostgreSQL Serverless ($20/mes)

S3 + CloudFront ($5/mes)
Bedrock Claude AI ($10/mes)
n8n (Ya incluido)

TOTAL: ~$40/mes → 25 meses con $1,000
```

---

## 🚀 Servicios a Usar

| Servicio | Propósito | Costo/mes |
|----------|-----------|-----------|
| **Aurora PostgreSQL** | Base de datos principal | ~$20 |
| **Bedrock (Claude)** | IA para mensajes | ~$10 |
| **S3 + CloudFront** | Almacenamiento y CDN | ~$5 |
| **Lambda** | Serverless functions | ~$5 |
| **API Gateway** | REST APIs | Incluido en Lambda |

---

## 📁 Archivos Importantes

- **aws-credentials.json** - Credenciales locales (NO SUBIR A GITHUB)
- **AWS_SETUP_GUIDE.md** - Guía completa paso a paso
- **AWS_N8N_INTEGRATION.md** - Workflows n8n con AWS
- **scripts/configure-aws.sh** - Script de configuración CLI

---

## ⚠️ IMPORTANTE

### ✅ HACER PRIMERO:
1. Configurar billing alerts
2. Crear budgets de $45/mes
3. Configurar CloudWatch alarms

### ❌ NO HACER:
1. NAT Gateway ($32/mes)
2. Application Load Balancer ($16/mes)
3. RDS Multi-AZ (doble costo)
4. EC2 t3.medium+ (innecesario)
5. Dejar recursos corriendo sin usar

---

## 📞 Próximos Pasos

1. **Leer:** `AWS_SETUP_GUIDE.md` completo
2. **Configurar:** IAM user y AWS CLI
3. **Crear:** Aurora PostgreSQL cluster
4. **Habilitar:** Bedrock models access
5. **Integrar:** n8n con AWS (ver `AWS_N8N_INTEGRATION.md`)
6. **Monitor:** Cost Explorer diariamente

---

## 🔗 Links Útiles

- **AWS Console:** https://128959995116.signin.aws.amazon.com/console
- **IAM:** https://console.aws.amazon.com/iam/
- **Bedrock:** https://console.aws.amazon.com/bedrock/
- **Cost Explorer:** https://console.aws.amazon.com/cost-management/
- **n8n:** https://n8n-n8n.ljmvxa.easypanel.host

---

**Última actualización:** 25 de diciembre de 2024
