# Migración a Neon PostgreSQL - Completada ✅

**Fecha:** 2026-02-22
**Estado:** ✅ COMPLETADA Y FUNCIONANDO

## Cambios Realizados

### 1. Configuración de Base de Datos

**Archivo actualizado:** `src/lib/db.ts`
- Configurado driver `@neondatabase/serverless` con soporte WebSocket
- Añadido `neonConfig.webSocketConstructor = ws` para Node.js
- Pool de conexiones configurado correctamente

**Variables de entorno actualizadas:**
- `.env.local` migrado de Aurora RDS a Neon
- Configuración de Neon:
  - Host: `ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech`
  - Database: `neondb`
  - Usuario: `neondb_owner`
  - SSL: requerido

### 2. Estructura de Base de Datos

**Tablas creadas:**
- `users` - Usuarios del sistema (clientes, proveedores, admin)
- `event_types` - Tipos de eventos
- `reservations` - Reservas de eventos
- `providers` - Proveedores de servicios
- `services` - Servicios adicionales

**Usuarios demo creados:**
- admin@happyhub.es (role: admin)
- cliente@happyhub.es (role: client)
- proveedor@happyhub.es (role: provider)
- Password para todos: `happyhub123`

### 3. Endpoints API Funcionando

✅ **POST /api/auth/register** - Registro de usuarios
- Validación con Zod
- Hashing de contraseñas con bcryptjs
- Generación de JWT token (30 días)
- Manejo de duplicados

✅ **POST /api/auth** - Login
- Verificación de credenciales en BD
- Generación de JWT token
- Retorno de datos de usuario

✅ **GET /api/auth** - Verificación de token
- Validación de JWT
- Verificación de usuario en BD
- Retorno de datos actualizados

✅ **GET /api/init-db** - Inicialización de BD
- Crea schema si no existe
- Inserta datos seed
- Idempotente (se puede ejecutar múltiples veces)

## Pruebas Realizadas

### ✅ Test 1: Inicialización de BD
```bash
curl http://localhost:3000/api/init-db
```
**Resultado:** Base de datos inicializada correctamente

### ✅ Test 2: Registro de Usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test1234","name":"Usuario Prueba","phone":"+34666555444"}'
```
**Resultado:** Usuario creado, token generado

### ✅ Test 3: Login
```bash
curl -X POST http://localhost:3000/api/auth \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test1234"}'
```
**Resultado:** Login exitoso, token válido

### ✅ Test 4: Verificación de Token
```bash
curl -X GET http://localhost:3000/api/auth \
  -H 'Authorization: Bearer <token>'
```
**Resultado:** Token válido, datos de usuario correctos

## Próximos Pasos Recomendados

### 1. Frontend - Páginas de Autenticación
Las páginas `/login` y `/register` ya existen y están configuradas para usar los endpoints.

**Para probar desde el navegador:**
1. Ir a `http://localhost:3000/register`
2. Crear una cuenta nueva
3. Ir a `http://localhost:3000/login`
4. Iniciar sesión

### 2. Migración de Datos Existentes (Opcional)
Si hay datos en Airtable o Aurora que necesitas migrar:
- Crear script de migración desde Airtable a Neon
- Exportar datos de Aurora (si aplica)
- Importar datos históricos

### 3. Actualizar n8n Workflows
Actualizar workflows de n8n para que guarden datos en Neon en lugar de Airtable:
- Conexión directa a PostgreSQL desde n8n
- Inserción de reservas en tabla `reservations`
- Vinculación con usuarios existentes

### 4. Endpoints Adicionales Necesarios
Crear endpoints para:
- **GET /api/reservations** - Listar reservas del usuario
- **GET /api/reservations/:id** - Detalles de reserva
- **POST /api/reservations** - Crear reserva (integrar con n8n)
- **GET /api/providers** - Listar proveedores
- **GET /api/availability** - Comprobar disponibilidad (usando función SQL)

### 5. Deployment a Producción
**Variables de entorno en Amplify/Vercel:**
```env
DATABASE_URL=postgresql://neondb_owner:npg_zr5iRHB3pgLw@ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=<generar nuevo secret para producción>
NEXTAUTH_URL=<url de producción>
NEXTAUTH_SECRET=<generar nuevo secret>
```

### 6. Seguridad
- [ ] Cambiar JWT_SECRET en producción
- [ ] Configurar CORS apropiadamente
- [ ] Implementar rate limiting en endpoints de auth
- [ ] Añadir refresh tokens para JWT
- [ ] Configurar Neon IP allowlist si es necesario

## Información de Conexión

### Neon Dashboard
- URL: https://console.neon.tech
- Proyecto: ep-morning-sky-abwuz6yr
- Región: AWS eu-west-2 (London)

### Connection String
```
postgresql://neondb_owner:npg_zr5iRHB3pgLw@ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

## Notas Técnicas

### Diferencias con Aurora RDS
1. **WebSocket requerido**: Neon usa WebSockets, necesita configuración especial en Node.js
2. **Serverless**: Neon escala automáticamente, sin necesidad de gestionar instancias
3. **Branching**: Neon permite crear branches de BD para testing (feature útil)
4. **Pooling**: Neon maneja pooling automáticamente

### Dependencias Necesarias
- `@neondatabase/serverless` - Driver principal
- `ws` - WebSocket para Node.js
- `pg` - Tipos de PostgreSQL
- `bcryptjs` - Hashing de contraseñas
- `jsonwebtoken` - JWT tokens

## Troubleshooting

### Error "Could not connect to database"
**Causa:** `.env.local` tenía configuración de Aurora
**Solución:** Actualizado a configuración de Neon

### Error "WebSocket not defined"
**Causa:** Neon necesita WebSocket en Node.js
**Solución:** Añadido `neonConfig.webSocketConstructor = ws`

### Variables de entorno no se cargan
**Causa:** Next.js cachea variables de entorno
**Solución:** Reiniciar `npm run dev` completamente

## Comandos Útiles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Inicializar/resetear base de datos
curl http://localhost:3000/api/init-db

# Ver logs de conexión
tail -f /tmp/next-dev.log | grep -i database

# Test de conectividad con Neon
psql "postgresql://neondb_owner:npg_zr5iRHB3pgLw@ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech/neondb?sslmode=require"
```

---

**Migración completada exitosamente** 🎉
**Desarrollador:** Claude Code
**Fecha:** 2026-02-22
