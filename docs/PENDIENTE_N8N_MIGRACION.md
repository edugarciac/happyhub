# PENDIENTE: Migración a n8n Production

## Estado Actual (2026-02-25 21:20)

**Instancia en uso:** Antigua (Easypanel) - `https://n8n-n8n.ljmvxa.easypanel.host`
**Instancia nueva:** Lista pero NO configurada SSL

## Pasos Pendientes (15 minutos total)

### 1. Configurar SSL en n8n Production (5 min)

**Conectar por navegador:**
https://eu-west-1.console.aws.amazon.com/ec2/home?region=eu-west-1#ConnectToInstance:instanceId=i-0b869fcbf14768c25

**Ejecutar en terminal:**
```bash
wget https://raw.githubusercontent.com/edugarciac/happyhub/main/infrastructure/setup-n8n-domain.sh
chmod +x setup-n8n-domain.sh
sudo ./setup-n8n-domain.sh n8n.happyhub.es edu.garciac@gmail.com
```

**Verificar:** https://n8n.happyhub.es (debe mostrar login n8n con HTTPS)

### 2. Migrar workflows (5 min)

**Desde instancia antigua:**
1. Login: https://n8n-n8n.ljmvxa.easypanel.host
2. Ve a cada workflow → **⋮** → **Download**
3. Guarda: `n8n-reserva-neon-whatsapp.json`

**A instancia nueva:**
1. Login: https://n8n.happyhub.es
2. Usuario: `admin` / Contraseña: `ChangeThisPassword123!`
3. **CAMBIAR CONTRASEÑA** inmediatamente
4. **Settings** → **Import from file**
5. Sube el JSON descargado
6. Verifica credenciales (Google Calendar, WhatsApp, Neon DB, etc.)
7. Activa el workflow

### 3. Actualizar webhook en Amplify (2 min)

**AWS Amplify Console:**
https://console.aws.amazon.com/amplify

1. Selecciona **HappyHub**
2. **App settings** → **Environment variables**
3. Variable: `N8N_WEBHOOK_URL`
4. Cambiar de: `https://n8n-n8n.ljmvxa.easypanel.host/webhook/reservation-request`
5. A: `https://n8n.happyhub.es/webhook/reservation-request`
6. **Save** → **Redeploy this version**

### 4. Probar reserva de prueba (3 min)

1. Ve a: https://www.happyhub.es/reservas
2. Completa formulario de prueba
3. Click **Solicitar reserva**
4. Verifica que no hay error
5. Revisa ejecución en: https://n8n.happyhub.es → **Executions**

### 5. Eliminar instancia antigua (30 seg)

**Solo cuando TODO funcione:**
```bash
# Terminar instancia antigua Easypanel
aws ec2 terminate-instances \
  --instance-ids i-0d996fc570003cba4 \
  --profile happyhub-cli \
  --region eu-west-1
```

**Ahorro:** ~€8/mes

## DNS Configurado (YA LISTO)

✅ `n8n.happyhub.es` → `52.208.80.224` (Route 53)
✅ Propagación: COMPLETA

## Instancia Nueva (Specs)

- **IP:** 52.208.80.224
- **Instance ID:** i-0b869fcbf14768c25
- **Type:** t3.small (2GB RAM, 30GB disk)
- **PostgreSQL:** Persistente
- **Backups:** Automáticos semanales → S3
- **Coste:** ~€19/mes

## Ventajas Post-Migración

✅ Mayor capacidad (t3.small vs t3.micro)
✅ Base de datos persistente (no se pierden datos)
✅ Backups automáticos
✅ Dominio propio con SSL
✅ No bloqueado por Zscaler (HTTPS puerto 443)

## Recursos

- Script setup: `infrastructure/setup-n8n-domain.sh`
- Key facts: `docs/project_notes/key_facts.md`
- Workflows: `n8n/n8n-nodes/`
