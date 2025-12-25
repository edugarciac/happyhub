# 📑 Índice - Sistema de Reservas HappyHub n8n

Bienvenido al sistema de gestión de reservas de HappyHub. Este índice te ayudará a encontrar rápidamente la información que necesitas.

---

## 🚀 Empezar Aquí

**¿Primera vez configurando el sistema?**

👉 Lee primero: **[INICIO_RAPIDO.md](./INICIO_RAPIDO.md)** (10 minutos)

---

## 📄 Documentación Disponible

### 1. **INICIO_RAPIDO.md** ⚡
**Para:** Configuración inicial rápida
**Tiempo:** 10 minutos
**Contenido:**
- Paso a paso de configuración
- Setup de credenciales
- Primera prueba del sistema
- Checklist de verificación

👉 **Usar cuando:** Acabas de clonar el proyecto y quieres ponerlo en marcha ya

---

### 2. **INSTRUCCIONES_CONFIGURACION.md** 📖
**Para:** Configuración detallada y troubleshooting
**Tiempo:** 20-30 minutos de lectura
**Contenido:**
- Descripción completa del flujo
- Configuración detallada de cada integración
- Estructura de Airtable
- Ejemplos de requests/responses
- Solución de problemas comunes
- Diagrama de flujo completo
- Notas de seguridad

👉 **Usar cuando:** Necesitas entender a fondo cómo funciona todo o tienes problemas

---

### 3. **README.md** 📚
**Para:** Visión general del sistema
**Tiempo:** 5 minutos de lectura
**Contenido:**
- Descripción de características
- Flujo de trabajo visual
- Respuestas del API
- Datos de entrada esperados
- Guía de testing rápida
- Integraciones externas
- Roadmap de mejoras

👉 **Usar cuando:** Quieres entender qué hace el sistema antes de configurarlo

---

### 4. **CONFIGURACION_URL.md** 🔧
**Para:** Configuración de URLs sin variables de entorno
**Tiempo:** 5 minutos
**Contenido:**
- Soluciones para n8n sin plan Enterprise
- Configuración para diferentes dominios
- Setup de desarrollo local con ngrok
- Configuración multi-entorno
- Testing de redirecciones

👉 **Usar cuando:** No tienes plan Enterprise de n8n (como en tu caso) o necesitas configurar URLs personalizadas

---

## 📦 Archivos del Sistema

### **n8n-reserva-con-validacion.json**
**Archivo principal del flujo n8n**
- Importar en n8n para crear el workflow completo
- Ya incluye validación de disponibilidad
- Configurado para `https://happyhub.es`

### **n8n-nodes.json** (Legacy)
**Flujo original sin validación**
- Versión anterior sin check de disponibilidad
- Mantener solo como referencia

### **test-examples.json**
**Colección de ejemplos de prueba**
- 8 ejemplos de payloads diferentes
- Comandos curl listos para usar
- Colección de Postman
- Respuestas esperadas

### **test-webhook.sh**
**Script interactivo de testing**
- Tests automatizados
- Output colorizado
- Múltiples escenarios de prueba

---

## 🎯 Rutas Rápidas por Caso de Uso

### "Quiero configurar el sistema por primera vez"
1. **[INICIO_RAPIDO.md](./INICIO_RAPIDO.md)** → Seguir paso a paso
2. **test-webhook.sh** → Probar que funciona
3. **README.md** → Entender el sistema completo

---

### "Tengo un error y no sé qué hacer"
1. **INSTRUCCIONES_CONFIGURACION.md** → Sección "Troubleshooting"
2. Revisar **Executions** en n8n para ver logs
3. Verificar credenciales en **Settings → Credentials**

---

### "Necesito cambiar la URL de redirección"
1. **[CONFIGURACION_URL.md](./CONFIGURACION_URL.md)** → Escenario correspondiente
2. Editar nodo "Crear Link de Pago Stripe" en n8n
3. **test-webhook.sh** → Probar cambios

---

### "Quiero testear el webhook"
**Opción 1 - Script interactivo:**
```bash
cd n8n
./test-webhook.sh
```

**Opción 2 - Manual con curl:**
```bash
curl -X POST https://n8n-n8n.ljmvxa.easypanel.host/webhook/reserva-happyhub \
  -H "Content-Type: application/json" \
  -d @test-examples.json
```

**Opción 3 - Desde Next.js:**
Ver código en `/api/webhook-reserva.ts`

---

### "Necesito personalizar el email o Airtable"
1. **INSTRUCCIONES_CONFIGURACION.md** → Secciones específicas
2. Editar nodos correspondientes en n8n
3. Probar con **test-webhook.sh**

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Next.js                       │
│                    /pages/reservas.tsx                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Route                         │
│               /api/webhook-reserva.ts                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP POST
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     n8n Webhook                             │
│     https://n8n-n8n.ljmvxa.easypanel.host         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ↓                     ↓
    ┌──────────────────┐   ┌──────────────────┐
    │ Normalizar Datos │   │   Validaciones   │
    └────────┬─────────┘   └──────────────────┘
             │
             ↓
    ┌──────────────────────────┐
    │  Google Calendar Check   │
    │  ¿Fecha disponible?      │
    └────────┬────────┬────────┘
             │        │
        ✅ SÍ       ❌ NO
             │        │
             │        └──────→ Respuesta 409
             │                "Fecha reservada"
             ↓
    ┌──────────────────┐
    │ Crear Evento en  │
    │ Google Calendar  │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Guardar en       │
    │ Airtable         │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐────────┐
    │ Stripe Payment   │ Claude │
    │ Link             │ AI Msg │
    └────────┬─────────┘────┬───┘
             │               │
             └───────┬───────┘
                     ↓
            ┌─────────────────┐
            │ Email HTML      │
            │ Confirmación    │
            └────────┬────────┘
                     │
                     ↓
            ┌─────────────────┐
            │ Respuesta 200   │
            │ + Reservation   │
            │ + Payment Link  │
            └─────────────────┘
```

---

## 🔗 Integraciones

| Servicio | Propósito | Credencial Necesaria |
|----------|-----------|---------------------|
| **Google Calendar** | Verificar disponibilidad y crear eventos | OAuth2 |
| **Airtable** | Base de datos de reservas | Personal Access Token |
| **Stripe** | Procesar pagos | Secret Key (API) |
| **Anthropic (Claude)** | Generar mensajes personalizados | API Key |
| **SMTP (Gmail/SendGrid)** | Enviar emails de confirmación | Usuario + Password |

---

## 📊 Datos del Sistema

### Endpoints

**Webhook n8n:**
```
POST https://n8n-n8n.ljmvxa.easypanel.host/webhook/reserva-happyhub
```

**API Next.js:**
```
POST /api/webhook-reserva
```

### Respuestas

| Status | Significado |
|--------|-------------|
| **200** | ✅ Reserva creada exitosamente |
| **409** | ⚠️ Conflicto - Fecha ya reservada |
| **400** | ❌ Bad Request - Faltan campos |
| **500** | 💥 Error del servidor |

---

## 🛠️ Mantenimiento

### Actualizar el Flujo
1. Hacer cambios en n8n
2. Exportar flujo actualizado
3. Reemplazar `n8n-reserva-con-validacion.json`
4. Documentar cambios en README
5. Probar con **test-webhook.sh**

### Backup
**Importante:** Hacer backup regular de:
- Flujo de n8n (exportar JSON)
- Credenciales (guardar en gestor de contraseñas)
- Base de Airtable (exportar CSV)

---

## 📈 Métricas Recomendadas

Monitorear en n8n:
- **Tasa de éxito**: % de ejecuciones exitosas
- **Conflictos**: % de respuestas 409
- **Tiempo de respuesta**: Promedio de duración
- **Errores**: Logs de ejecuciones fallidas

---

## 🤝 Contribuir

Si haces mejoras al flujo:
1. Actualizar JSON del flujo
2. Actualizar documentación relevante
3. Agregar ejemplo en `test-examples.json`
4. Probar con script de testing

---

## 📞 Soporte

### En caso de problemas:

1. **Revisar logs en n8n:**
   - Ir a Executions
   - Buscar ejecución fallida
   - Ver detalles del error

2. **Consultar documentación:**
   - INSTRUCCIONES_CONFIGURACION.md → "Troubleshooting"
   - CONFIGURACION_URL.md → Problemas de redirección

3. **Verificar credenciales:**
   - Settings → Credentials
   - Test connection en cada una

4. **Revisar integraciones externas:**
   - Google Calendar API quota
   - Stripe API status
   - Anthropic API limits
   - SMTP connection

---

## 📅 Versión y Actualizaciones

**Versión actual:** 1.0
**Última actualización:** 22 de diciembre de 2024
**Compatible con:**
- n8n v2.0.3+
- Next.js 14+
- Node.js 18+

---

## ✨ Características Principales

✅ Validación de disponibilidad en tiempo real
✅ Prevención de reservas duplicadas
✅ Integración completa con Google Calendar
✅ Base de datos en Airtable
✅ Procesamiento de pagos con Stripe
✅ Mensajes personalizados con IA
✅ Emails HTML profesionales
✅ Sistema de testing completo
✅ Documentación exhaustiva

---

## 🎓 Orden de Lectura Recomendado

**Para nuevos usuarios:**
1. INDEX.md (este archivo) ← **Estás aquí**
2. README.md (5 min)
3. INICIO_RAPIDO.md (10 min)
4. CONFIGURACION_URL.md (si aplica)
5. test-webhook.sh (probar)
6. INSTRUCCIONES_CONFIGURACION.md (referencia)

**Para usuarios experimentados:**
1. README.md (revisar cambios)
2. n8n-reserva-con-validacion.json (importar)
3. CONFIGURACION_URL.md (ajustar URLs)
4. test-webhook.sh (verificar)

---

¿Listo para empezar? 👉 **[INICIO_RAPIDO.md](./INICIO_RAPIDO.md)**
