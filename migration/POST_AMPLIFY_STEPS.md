# Post-Amplify Deploy - Pasos Finales

Una vez que Amplify completó el build exitosamente.

---

## 📍 Paso 1: Obtener URL de tu App

En Amplify Console verás algo como:
```
https://main.d1a2b3c4d5e6f.amplifyapp.com
```

Copia esa URL.

---

## 🗄️ Paso 2: Aplicar Schema PostgreSQL

### Opción A: Via API Route (Más Simple)

```bash
# Reemplaza con tu URL de Amplify
AMPLIFY_URL="https://main.xxxxx.amplifyapp.com"

# Llamar endpoint de inicialización
curl -v $AMPLIFY_URL/api/init-db
```

**Resultado esperado**:
```json
{
  "success": true,
  "message": "Database initialized successfully!",
  "info": {
    "database": "happyhub",
    "host": "happyhub-db-cluster.cluster...",
    "timestamp": "2025-02-18T..."
  }
}
```

### Opción B: Desde el Navegador

```bash
# Abrir en navegador
open $AMPLIFY_URL/api/init-db
```

Deberías ver el JSON de success.

---

## ✅ Paso 3: Verificar que Funciona

### 3.1. Abrir Home

```bash
open $AMPLIFY_URL
```

Deberías ver tu página de inicio de HappyHub.

### 3.2. Probar Navegación

Visita:
- ✅ `/` - Home
- ✅ `/servicios` - Catálogo de servicios
- ✅ `/disponibilidad` - Calendario
- ✅ `/reservas` - Formulario de reserva

### 3.3. Probar Login (Si existe)

Usuario demo:
- Email: `admin@happyhub.es`
- Password: `happyhub123`

### 3.4. Crear Reserva de Prueba

1. Ir a `/reservas`
2. Llenar formulario
3. Enviar
4. Verificar que se guarda (si n8n no funciona aún, puede dar error, pero el save en DB debería funcionar)

---

## 🔍 Paso 4: Verificar Logs

En Amplify Console:

1. Ve a tu app → **"Monitoring"** (menú izquierdo)
2. Click **"Logs"**
3. Buscar mensajes:
   ```
   ✅ Database schema already exists
   ```
   O:
   ```
   📝 Creating database schema...
   ✅ Schema created
   ```

---

## 🎉 Si Todo Funciona

¡Migración completa!

```
✅ Aurora PostgreSQL desplegado
✅ Next.js en AWS Amplify
✅ Schema aplicado
✅ App funcionando en producción
✅ HTTPS automático
✅ CI/CD configurado
```

**Coste total**: 0€/mes con crédito AWS

---

## 🐛 Si Algo Falla

### Build falló

Ver logs en Amplify → Build details → Logs

Causas comunes:
- Variables de entorno faltantes
- Error de sintaxis en código
- Dependencias

**Solución**: Corregir y redeploy

### API init-db retorna error

Ver logs de Amplify Monitoring.

**Solución**: Verificar variables DB_* están correctas

### No se puede conectar a Aurora

**Causa**: Network issue

**Solución**: Verificar security group, VPC settings

---

Avísame el estado del build y continuamos! 🚀
