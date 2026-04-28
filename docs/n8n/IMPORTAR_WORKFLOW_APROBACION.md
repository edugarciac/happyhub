# Importar Workflow de Aprobación en n8n

Guía rápida para importar y configurar el workflow en 5 minutos.

## Paso 1: Acceder a n8n

```
URL: http://52.208.80.224:5678
Usuario: admin
Password: ChangeThisPassword123!
```

## Paso 2: Configurar Variables de Entorno

**Settings → Environment Variables → Add**

```
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_API_TOKEN=EAAXSgOo4ZA0oBQ5fZCCHCFXFpFZA3reZC8btEFw7G4fsauu2yhkZBSy2WhMHJTI0dc6Ps6HsjLZBTLXZADyZByoBI4DQ0aVtNi2h7P99V5owzqZBYCleWb9rlZCZBQnb1KlqXcZAwoXPxg9HVggWIFvlBXkIOSeWwvTMhQwPOLBDnxA40MFdgSKbZBdOsFOEA2cNLd6bsvCPnzbzOuNJucb5C3Gplk6a6oVhvD9Or70ZCEZAk8ADVRD6FTcZC3ws9g01Wq1ekARe6R0EY8PolQd11KSSFkwz
```

**Nota:** Si no tienes `WHATSAPP_PHONE_NUMBER_ID`, consíguelo en:
https://developers.facebook.com/apps → Tu App → WhatsApp → API Setup

## Paso 3: Configurar Credenciales

**Credentials → Add → HTTP Header Auth**

```
Name: WhatsApp Bearer Token
Header Name: Authorization
Header Value: Bearer EAAXSgOo4ZA0oBQ5fZCCHCFXFpFZA3reZC8btEFw7G4fsauu2yhkZBSy2WhMHJTI0dc6Ps6HsjLZBTLXZADyZByoBI4DQ0aVtNi2h7P99V5owzqZBYCleWb9rlZCZBQnb1KlqXcZAwoXPxg9HVggWIFvlBXkIOSeWwvTMhQwPOLBDnxA40MFdgSKbZBdOsFOEA2cNLd6bsvCPnzbzOuNJucb5C3Gplk6a6oVhvD9Or70ZCEZAk8ADVRD6FTcZC3ws9g01Wq1ekARe6R0EY8PolQd11KSSFkwz
```

Save as: "whatsapp-auth"

**Credentials → Add → SMTP (Gmail)**

```
Name: Gmail SMTP
User: hola@happyhub.es
Password: [tu app password de Gmail]
Host: smtp.gmail.com
Port: 587
```

Save as: "smtp-gmail"

## Paso 4: Importar Workflow

1. **Workflows → Add Workflow → Import from File**
2. **Seleccionar archivo:** `n8n/workflows/reservation-approval-flow.json`
3. **Click "Import"**
4. **Workflow importado con 11 nodos:**
   - Webhook - New Reservation
   - Email - Customer Confirmation
   - WhatsApp - Notify Admin
   - Respond to Webhook
   - Webhook - Status Changed
   - IF Approved
   - Email - Approval / Rejection
   - WhatsApp - Approval / Rejection
   - Respond - Status Changed

## Paso 5: Activar Workflow

1. **Click "Activate"** en la parte superior derecha
2. **Verifica status:** Active (toggle verde)

## Paso 6: Obtener URLs de Webhook

1. **Click en nodo "Webhook - New Reservation"**
2. **Copiar "Production URL":** http://52.208.80.224:5678/webhook/reservation-new
3. **Click en nodo "Webhook - Status Changed"**
4. **Copiar "Production URL":** http://52.208.80.224:5678/webhook/reservation-status-changed

## Paso 7: Configurar URLs en Amplify

**AWS Amplify Console → Environment Variables:**

```
N8N_WEBHOOK_URL=http://52.208.80.224:5678/webhook
```

**Importante:** La variable debe apuntar a la base URL, el código añadirá `/reservation-new` o `/reservation-status-changed` según corresponda.

**Redeploy:** Click "Redeploy this version" para aplicar cambios.

## Test del Workflow

### Test 1: Nueva Reserva

```bash
# Desde terminal, simular nueva reserva
curl -X POST http://52.208.80.224:5678/webhook/reservation-new \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "customer_phone": "+34612345678",
    "event_date": "2026-03-15",
    "time_slot": "afternoon",
    "event_type": "cumpleaños",
    "guests": 30,
    "total_price": 185,
    "reservation_id": 999
  }'
```

**Verifica:**
- ✓ Email llega a test@example.com
- ✓ WhatsApp llega a +34 624 645 517
- ✓ Link funciona: https://www.happyhub.es/admin/approve-reservation/999

### Test 2: Aprobar Reserva

1. Entra a https://www.happyhub.es/admin/approve-reservation/999
2. Click "Aprobar Reserva"
3. **Verifica:**
   - ✓ Email aprobación llega
   - ✓ WhatsApp aprobación llega

### Test 3: Rechazar Reserva

1. Crear otra reserva test
2. En página de aprobación, click "Rechazar"
3. Escribir motivo: "Fecha ocupada"
4. **Verifica:**
   - ✓ Email rechazo llega con motivo
   - ✓ WhatsApp rechazo llega con motivo

## Troubleshooting

**WhatsApp no envía:**
```bash
# Verifica en n8n logs
ssh -i ~/.ssh/n8n-happyhub-key.pem ubuntu@52.208.80.224 'cd /opt/n8n && sudo docker-compose logs -f n8n | grep WhatsApp'
```

**Email no llega:**
- Check SMTP credentials
- Verify Gmail App Password is correct
- Check spam folder

**Workflow no se ejecuta:**
```bash
# Verifica workflow está activo
# En n8n UI: Workflows → "HappyHub - Reservation Approval Flow" → Toggle debe estar ON (verde)
```

## Próximos Pasos

Después de configurar y test:
1. ✅ Marcar tareas 5.1-7.8 completadas
2. ✅ Update environment variables en Amplify
3. ✅ Test con reserva real
4. Monitor executions en n8n UI primeras 24h
