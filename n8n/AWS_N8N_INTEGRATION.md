# Integración de n8n con AWS para HappyHub

Esta guía explica cómo integrar n8n con los servicios AWS para HappyHub.

---

## 🔐 Configurar Credenciales AWS en n8n

### Paso 1: Acceder a n8n
```
URL: https://n8n-happyhub-n8n.c13yv5.easypanel.host
```

### Paso 2: Agregar Credenciales AWS

1. **Ir a Settings → Credentials**
2. **Click en "Add Credential"**
3. **Buscar "AWS"** en el selector
4. **Completar datos:**
   ```
   Credential Name: AWS HappyHub
   Access Key ID: [TU_ACCESS_KEY_ID de IAM user]
   Secret Access Key: [TU_SECRET_ACCESS_KEY]
   Region: us-east-1
   ```
5. **Click en "Save"**

### Paso 3: Verificar Credenciales

Crear un workflow simple para probar:
```json
{
  "nodes": [
    {
      "parameters": {
        "service": "sts",
        "operation": "getCallerIdentity"
      },
      "name": "Test AWS Credentials",
      "type": "n8n-nodes-base.aws",
      "typeVersion": 1,
      "position": [250, 300],
      "credentials": {
        "aws": {
          "id": "1",
          "name": "AWS HappyHub"
        }
      }
    }
  ]
}
```

Si funciona, verás tu Account ID: **128959995116**

---

## 🗄️ Workflow: Guardar Reserva en Aurora PostgreSQL

### Opción A: Via Lambda Function (Recomendado)

```json
{
  "name": "HappyHub - Save Reservation to Aurora",
  "nodes": [
    {
      "parameters": {
        "path": "reserva-happyhub",
        "options": {
          "responseMode": "responseNode"
        },
        "httpMethod": "POST"
      },
      "name": "Webhook Reserva",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "functionCode": "const reservationData = items[0].json.body || items[0].json;\n\nreturn [{\n  json: {\n    operation: 'CREATE_RESERVATION',\n    data: {\n      nombre: reservationData.nombre,\n      email: reservationData.email,\n      telefono: reservationData.telefono,\n      fecha: reservationData.fecha,\n      hora: reservationData.hora,\n      timeSlot: reservationData.timeSlot || 'afternoon',\n      pax: reservationData.pax,\n      extras: reservationData.extras || [],\n      tipoEvento: reservationData.tipoEvento,\n      precioTotal: reservationData.precioTotal,\n      estado: 'pending',\n      createdAt: new Date().toISOString()\n    }\n  }\n}];"
      },
      "name": "Prepare Lambda Payload",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "service": "lambda",
        "operation": "invoke",
        "functionName": "happyhub-save-reservation",
        "payload": "={{JSON.stringify($json)}}"
      },
      "name": "Invoke Lambda - Save to Aurora",
      "type": "n8n-nodes-base.aws",
      "typeVersion": 1,
      "position": [650, 300],
      "credentials": {
        "aws": {
          "id": "1",
          "name": "AWS HappyHub"
        }
      }
    },
    {
      "parameters": {
        "functionCode": "const lambdaResponse = JSON.parse(items[0].json.Payload);\nconst body = JSON.parse(lambdaResponse.body);\n\nreturn [{\n  json: {\n    success: true,\n    reservationId: body.reservationId,\n    message: 'Reserva guardada exitosamente'\n  }\n}];"
      },
      "name": "Parse Response",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{JSON.stringify($json)}}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook Reserva": {
      "main": [[{"node": "Prepare Lambda Payload", "type": "main", "index": 0}]]
    },
    "Prepare Lambda Payload": {
      "main": [[{"node": "Invoke Lambda - Save to Aurora", "type": "main", "index": 0}]]
    },
    "Invoke Lambda - Save to Aurora": {
      "main": [[{"node": "Parse Response", "type": "main", "index": 0}]]
    },
    "Parse Response": {
      "main": [[{"node": "Respond to Webhook", "type": "main", "index": 0}]]
    }
  }
}
```

### Opción B: Via HTTP Request Directo a Aurora (Menos recomendado)

**Nota:** Requiere que Aurora tenga Data API habilitada.

```json
{
  "parameters": {
    "service": "rds-data",
    "operation": "executeStatement",
    "resourceArn": "arn:aws:rds:us-east-1:128959995116:cluster:happyhub-db-cluster",
    "secretArn": "arn:aws:secretsmanager:us-east-1:128959995116:secret:happyhub-db-secret",
    "database": "happyhub",
    "sql": "INSERT INTO reservations (nombre, email, telefono, fecha, hora, time_slot, pax, extras, tipo_evento, precio_total, estado) VALUES (:nombre, :email, :telefono, :fecha, :hora, :time_slot, :pax, :extras, :tipo_evento, :precio_total, :estado)",
    "parameters": [
      {"name": "nombre", "value": {"stringValue": "={{$json.nombre}}"}},
      {"name": "email", "value": {"stringValue": "={{$json.email}}"}},
      {"name": "telefono", "value": {"stringValue": "={{$json.telefono}}"}},
      {"name": "fecha", "value": {"stringValue": "={{$json.fecha}}"}},
      {"name": "hora", "value": {"stringValue": "={{$json.hora}}"}},
      {"name": "time_slot", "value": {"stringValue": "={{$json.timeSlot}}"}},
      {"name": "pax", "value": {"longValue": "={{$json.pax}}"}},
      {"name": "extras", "value": {"stringValue": "={{JSON.stringify($json.extras)}}"}},
      {"name": "tipo_evento", "value": {"stringValue": "={{$json.tipoEvento}}"}},
      {"name": "precio_total", "value": {"doubleValue": "={{$json.precioTotal}}"}},
      {"name": "estado", "value": {"stringValue": "pending"}}
    ]
  },
  "name": "Save to Aurora via RDS Data API",
  "type": "n8n-nodes-base.aws",
  "credentials": {
    "aws": "AWS HappyHub"
  }
}
```

---

## 🤖 Workflow: Generar Mensajes con Amazon Bedrock

### Usando Claude 3.5 Sonnet

```json
{
  "name": "HappyHub - Generate AI Message with Bedrock",
  "nodes": [
    {
      "parameters": {
        "method": "POST",
        "url": "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-5-sonnet-20241022-v2:0/invoke",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "aws",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [],
          "specifyBody": "json",
          "jsonBody": "={\n  \"anthropic_version\": \"bedrock-2023-05-31\",\n  \"messages\": [\n    {\n      \"role\": \"user\",\n      \"content\": \"Genera un mensaje de confirmación profesional y amable para una reserva en HappyHub con los siguientes datos:\\n\\nCliente: {{$json.nombre}}\\nFecha: {{$json.fecha}}\\nHora: {{$json.hora}}\\nPersonas: {{$json.pax}}\\nTipo de evento: {{$json.tipoEvento}}\\n\\nIncluye:\\n1. Saludo personalizado\\n2. Confirmación de reserva\\n3. Detalles del evento\\n4. Recordatorio de realizar el pago\\n5. Despedida cordial\"\n    }\n  ],\n  \"max_tokens\": 500,\n  \"temperature\": 0.7\n}"
        }
      },
      "name": "Bedrock - Claude 3.5 Sonnet",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [450, 300],
      "credentials": {
        "aws": {
          "id": "1",
          "name": "AWS HappyHub"
        }
      }
    },
    {
      "parameters": {
        "functionCode": "const bedrockResponse = items[0].json;\nconst messageContent = bedrockResponse.content[0].text;\n\nreturn [{\n  json: {\n    ...items[0].json,\n    generatedMessage: messageContent,\n    inputTokens: bedrockResponse.usage.input_tokens,\n    outputTokens: bedrockResponse.usage.output_tokens\n  }\n}];"
      },
      "name": "Extract AI Message",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "Bedrock - Claude 3.5 Sonnet": {
      "main": [[{"node": "Extract AI Message", "type": "main", "index": 0}]]
    }
  }
}
```

### Usando Claude 3 Haiku (Más rápido y económico)

Cambiar el `model` a:
```json
"url": "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-haiku-20240307-v1:0/invoke"
```

### Comparación de Modelos Bedrock

| Modelo | Velocidad | Costo/1M tokens | Mejor para |
|--------|-----------|----------------|------------|
| Claude 3.5 Sonnet | Media | $3.00 input / $15.00 output | Mensajes complejos, creatividad |
| Claude 3 Haiku | Rápida | $0.25 input / $1.25 output | Confirmaciones simples, respuestas rápidas |
| Titan Text | Muy rápida | $0.15 input / $0.20 output | Summaries, clasificación |

**Recomendación para HappyHub:**
- **Confirmaciones de reserva:** Claude 3 Haiku (económico y rápido)
- **Descripciones de eventos personalizados:** Claude 3.5 Sonnet
- **Clasificación de solicitudes:** Titan Text

---

## 📦 Workflow: Subir Archivos a S3

### Upload de Imágenes de Eventos

```json
{
  "name": "HappyHub - Upload Image to S3",
  "nodes": [
    {
      "parameters": {
        "path": "upload-image",
        "options": {
          "responseMode": "responseNode"
        },
        "httpMethod": "POST"
      },
      "name": "Webhook Upload",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "upload",
        "bucketName": "happyhub-assets-prod",
        "fileName": "events/{{$json.eventId}}/{{$json.filename}}",
        "binaryData": true,
        "binaryPropertyName": "data",
        "additionalFields": {
          "acl": "public-read",
          "contentType": "={{$json.contentType}}"
        }
      },
      "name": "Upload to S3",
      "type": "n8n-nodes-base.aws",
      "typeVersion": 1,
      "position": [450, 300],
      "credentials": {
        "aws": {
          "id": "1",
          "name": "AWS HappyHub"
        }
      }
    },
    {
      "parameters": {
        "functionCode": "const s3Response = items[0].json;\nconst cdnUrl = `https://d1234567890.cloudfront.net/events/${s3Response.key}`;\n\nreturn [{\n  json: {\n    success: true,\n    url: cdnUrl,\n    key: s3Response.key,\n    bucket: s3Response.bucket\n  }\n}];"
      },
      "name": "Generate CDN URL",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{JSON.stringify($json)}}"
      },
      "name": "Respond with URL",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [850, 300]
    }
  ],
  "connections": {
    "Webhook Upload": {
      "main": [[{"node": "Upload to S3", "type": "main", "index": 0}]]
    },
    "Upload to S3": {
      "main": [[{"node": "Generate CDN URL", "type": "main", "index": 0}]]
    },
    "Generate CDN URL": {
      "main": [[{"node": "Respond with URL", "type": "main", "index": 0}]]
    }
  }
}
```

---

## 🔍 Workflow: Consultar Disponibilidad desde Aurora

### Via Lambda Function

```json
{
  "name": "HappyHub - Check Availability",
  "nodes": [
    {
      "parameters": {
        "service": "lambda",
        "operation": "invoke",
        "functionName": "happyhub-check-availability",
        "payload": "={\"fecha\": \"{{$json.fecha}}\", \"timeSlot\": \"{{$json.timeSlot}}\"}"
      },
      "name": "Lambda - Check Availability",
      "type": "n8n-nodes-base.aws",
      "typeVersion": 1,
      "position": [450, 300],
      "credentials": {
        "aws": "AWS HappyHub"
      }
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.available}}",
              "value2": true
            }
          ]
        }
      },
      "name": "IF Available",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ]
}
```

---

## 💰 Monitoreo de Costos en n8n

### Workflow: Daily Cost Report

```json
{
  "name": "AWS Daily Cost Report",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 9 * * *"
            }
          ]
        }
      },
      "name": "Schedule - Daily 9 AM",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "service": "ce",
        "operation": "getCostAndUsage",
        "timePeriod": {
          "start": "={{$now.minus({days: 1}).toFormat('yyyy-MM-dd')}}",
          "end": "={{$now.toFormat('yyyy-MM-dd')}}"
        },
        "granularity": "DAILY",
        "metrics": ["BlendedCost"]
      },
      "name": "Get Yesterday Costs",
      "type": "n8n-nodes-base.aws",
      "typeVersion": 1,
      "position": [450, 300],
      "credentials": {
        "aws": "AWS HappyHub"
      }
    },
    {
      "parameters": {
        "functionCode": "const costs = items[0].json.ResultsByTime[0];\nconst amount = parseFloat(costs.Total.BlendedCost.Amount);\nconst date = costs.TimePeriod.Start;\n\nreturn [{\n  json: {\n    date,\n    amount: amount.toFixed(2),\n    currency: costs.Total.BlendedCost.Unit,\n    remainingCredits: (1000 - amount).toFixed(2)\n  }\n}];"
      },
      "name": "Format Cost Data",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "text",
              "value": "💰 AWS Daily Cost Report\\n\\nFecha: {{$json.date}}\\nGasto: ${{$json.amount}}\\nCréditos restantes: ${{$json.remainingCredits}}"
            }
          ]
        }
      },
      "name": "Send to Slack",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [850, 300]
    }
  ]
}
```

---

## 📊 Best Practices

### 1. Seguridad
- ✅ Usar IAM roles con mínimos permisos necesarios
- ✅ Rotar credenciales cada 90 días
- ✅ Nunca hardcodear credenciales en workflows
- ✅ Usar AWS Secrets Manager para passwords de BD

### 2. Optimización de Costos
- ✅ Usar Lambda para operaciones esporádicas
- ✅ Configurar auto-scaling en Aurora
- ✅ Usar CloudFront para reducir tráfico a S3
- ✅ Implementar lifecycle policies en S3 (borrar archivos viejos)
- ✅ Usar Bedrock Haiku para mensajes simples

### 3. Monitoring
- ✅ Configurar CloudWatch alarms
- ✅ Workflow diario de reporte de costos
- ✅ Revisar Cost Explorer semanalmente
- ✅ Logs de Lambda para debugging

### 4. Arquitectura
- ✅ Usar Lambda entre n8n y Aurora (capa de abstracción)
- ✅ Implementar retry logic en workflows críticos
- ✅ Error handling en todos los nodos AWS
- ✅ Timeout adecuado (Lambda: 30s, workflows: 5min)

---

## 🆘 Troubleshooting

### Error: "The security token included in the request is invalid"
**Causa:** Credenciales incorrectas o expiradas
**Solución:**
1. Verificar Access Key ID y Secret en Settings → Credentials
2. Regenerar credenciales en IAM Console
3. Actualizar en n8n

### Error: "AccessDenied" en Bedrock
**Causa:** No solicitaste acceso al modelo
**Solución:**
1. Ir a Bedrock Console
2. Model access → Request access
3. Esperar aprobación (usualmente instantánea)

### Error: "Lambda function not found"
**Causa:** Función Lambda no existe o región incorrecta
**Solución:**
1. Verificar nombre de función: `aws lambda list-functions --profile happyhub`
2. Verificar región en credenciales de n8n (debe ser us-east-1)

### Costos muy altos
**Solución:**
1. Revisar Cost Explorer: https://console.aws.amazon.com/cost-management/
2. Detener recursos innecesarios
3. Ajustar capacidad de Aurora
4. Usar modelos más baratos de Bedrock (Haiku)

---

## 📚 Recursos

- [n8n AWS Node Documentation](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.aws/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Aurora Serverless v2 Guide](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

---

**Última actualización:** 25 de diciembre de 2024
**Versión:** 1.0
