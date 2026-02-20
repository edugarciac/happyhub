# Configuración del Sistema de Autenticación

Sistema de login y registro con email/password conectado a PostgreSQL.

## Archivos Implementados

### Backend (API)
- `src/pages/api/auth.ts` - Login y verificación de token (actualizado para usar DB)
- `src/pages/api/auth/register.ts` - Registro de nuevos usuarios
- `src/utils/db/users.ts` - Helper functions para operaciones de usuario

### Frontend
- `src/pages/login.tsx` - Página de inicio de sesión
- `src/pages/register.tsx` - Página de registro de nuevos usuarios

### Scripts
- `scripts/init-database.sh` - Script para inicializar el esquema de base de datos

## Requisitos Previos

1. **PostgreSQL** instalado y corriendo (local o AWS RDS Aurora)
2. **Node.js 18+** y npm instalados

## Configuración Paso a Paso

### 1. Configurar Variables de Entorno

Edita el archivo `.env` y configura las credenciales de tu base de datos PostgreSQL:

```bash
# Database Configuration (PostgreSQL)
DB_HOST=localhost                  # O tu host de RDS
DB_PORT=5432
DB_NAME=happyhub
DB_USER=postgres                   # Tu usuario de PostgreSQL
DB_PASSWORD=your-password-here     # Tu contraseña de PostgreSQL

# JWT Configuration
JWT_SECRET=your-jwt-secret-change-in-production  # Genera uno seguro
```

**Generar JWT_SECRET seguro:**
```bash
openssl rand -base64 32
```

### 2. Crear la Base de Datos (si no existe)

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE happyhub;

# Salir
\q
```

### 3. Inicializar el Esquema

Ejecuta el script de inicialización:

```bash
bash scripts/init-database.sh
```

Este script:
- Crea todas las tablas necesarias (`users`, `reservations`, `providers`, etc.)
- Inserta datos de prueba
- Crea 3 usuarios demo

### 4. Usuarios de Prueba

El script crea estos usuarios (password: `happyhub123`):

| Email | Contraseña | Rol | Descripción |
|-------|------------|-----|-------------|
| admin@happyhub.es | happyhub123 | admin | Acceso completo al panel admin |
| cliente@happyhub.es | happyhub123 | client | Usuario cliente normal |
| proveedor@happyhub.es | happyhub123 | provider | Usuario proveedor de servicios |

### 5. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Probar el Sistema

### Página de Login
```
http://localhost:3000/login
```

### Página de Registro
```
http://localhost:3000/register
```

### Flujo de Prueba

1. **Registrarse:**
   - Ve a `/register`
   - Completa el formulario con email, password, nombre y teléfono
   - Password debe tener mínimo 8 caracteres, incluir letras y números
   - Al completar, se crea la cuenta y se inicia sesión automáticamente

2. **Iniciar Sesión:**
   - Ve a `/login`
   - Usa uno de los usuarios demo o tu cuenta recién creada
   - Según el rol, serás redirigido a:
     - Admin → `/admin`
     - Provider → `/proveedores`
     - Client → `/` (página principal)

3. **Verificar Sesión:**
   - El token JWT se guarda en localStorage
   - Se incluye automáticamente en todas las peticiones API (via `src/lib/apiClient.ts`)
   - La sesión dura 30 días

## Esquema de Base de Datos

### Tabla `users`

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'client',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Roles disponibles:** `client`, `provider`, `admin`

## API Endpoints

### POST /api/auth
**Descripción:** Login con email y contraseña

**Request:**
```json
{
  "email": "cliente@happyhub.es",
  "password": "happyhub123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "cliente@happyhub.es",
    "name": "Cliente Demo",
    "role": "client"
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Credenciales inválidas"
}
```

### GET /api/auth
**Descripción:** Verificar token JWT

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "cliente@happyhub.es",
    "name": "Cliente Demo",
    "role": "client"
  }
}
```

### POST /api/auth/register
**Descripción:** Registrar nuevo usuario

**Request:**
```json
{
  "email": "nuevo@ejemplo.com",
  "password": "Password123",
  "name": "Nuevo Usuario",
  "phone": "+34612345678"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 4,
    "email": "nuevo@ejemplo.com",
    "name": "Nuevo Usuario",
    "phone": "+34612345678",
    "role": "client"
  }
}
```

**Response (409):**
```json
{
  "success": false,
  "error": "Este email ya está registrado. Por favor, inicia sesión o usa otro email"
}
```

## Validaciones

### Email
- Formato válido de email
- Único en la base de datos

### Password
- Mínimo 8 caracteres
- Debe contener letras (a-z, A-Z)
- Debe contener números (0-9)
- Se guarda hasheado con bcrypt (10 salt rounds)

### Teléfono
- Entre 9 y 15 dígitos
- Puede incluir + al inicio
- Ejemplo: `+34612345678` o `612345678`

### Nombre
- Mínimo 2 caracteres

## Seguridad

### Password Hashing
- Usa bcryptjs con 10 salt rounds
- Passwords nunca se guardan en texto plano
- Se comparan con `bcrypt.compare()` en login

### JWT Tokens
- Firmados con `JWT_SECRET`
- Expiran en 30 días
- Incluyen: `userId`, `email`, `role`
- Se guardan en localStorage del navegador
- Se envían en header `Authorization: Bearer <token>`

### Protección CSRF
- API valida tokens en cada request
- Tokens se regeneran en cada login

## Troubleshooting

### Error: "Cannot find module '@/lib/db'"
**Solución:** Verifica que tsconfig.json tenga configurado:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Error: "Database connection failed"
**Solución:**
1. Verifica que PostgreSQL esté corriendo: `pg_isready`
2. Verifica las credenciales en `.env`
3. Verifica que la base de datos exista: `psql -U postgres -l`

### Error: "Este email ya está registrado"
**Solución:**
- El email ya existe en la DB
- Usa otro email o inicia sesión con las credenciales existentes

### Token no persiste entre recargas
**Solución:**
- Verifica que localStorage esté habilitado en el navegador
- Verifica que el código guarde el token: `localStorage.setItem('token', result.token)`

### Error 401 en requests autenticados
**Solución:**
1. Verifica que el token esté en localStorage: `console.log(localStorage.getItem('token'))`
2. Verifica que `src/lib/apiClient.ts` esté inyectando el token en headers
3. Verifica que `JWT_SECRET` sea el mismo en todas las requests

## Próximos Pasos (Opcional)

### Google OAuth (desde specs)
Para agregar autenticación con Google, sigue la guía en:
- `specs/001-email-password-auth/quickstart.md`
- Requiere configurar Google Cloud Console
- Implementa NextAuth.js

### Password Reset
Para agregar recuperación de contraseña:
1. Crear endpoints `POST /api/auth/reset-password` y `POST /api/auth/confirm-reset`
2. Integrar con n8n para envío de emails
3. Crear páginas `/reset-password` y `/reset/[token]`

### Profile Management
Para agregar gestión de perfil:
1. Crear endpoint `PUT /api/user/profile`
2. Crear página `/profile` con formulario de edición
3. Permitir cambio de contraseña

## Soporte

Para problemas específicos:
1. Revisa los logs del servidor: `npm run dev`
2. Revisa la consola del navegador (F12)
3. Verifica la configuración de `.env`
4. Verifica que la DB esté inicializada: `psql -U postgres -d happyhub -c "\dt"`

---

**Última actualización:** 2026-02-20
**Versión:** 1.0.0
**Branch:** 001-email-password-auth
