# Aplicar Schema usando AWS RDS Query Editor

**Método más fácil**: Ejecutar SQL desde tu navegador, sin configuración técnica.

**Duración**: 10-15 minutos

---

## 📋 Paso a Paso

### Paso 1: Abrir RDS Query Editor

1. Abre este enlace en tu navegador:
   ```
   https://eu-west-1.console.aws.amazon.com/rds/home?region=eu-west-1#query-editor:
   ```

2. Si te pide login, usa tus credenciales de AWS Console

### Paso 2: Conectar a la Base de Datos

En Query Editor, completa el formulario:

```
Database instance or cluster: happyhub-db-cluster
Database name: happyhub
Database username: dbadmin
Password: c0MAkvDuZ6yWhfUUzgMh
```

Click **"Connect to database"**

### Paso 3: Aplicar Schema SQL

1. **Abrir archivo en tu Mac**:
   ```bash
   open -a "TextEdit" migration/schema.sql
   # O con VS Code:
   code migration/schema.sql
   ```

2. **Copiar TODO el contenido** (Cmd+A, Cmd+C)

3. **Pegar en Query Editor** y click **"Run"**

4. Deberías ver mensajes:
   ```
   CREATE TABLE
   CREATE TABLE
   CREATE TABLE
   CREATE INDEX
   ...
   ```

### Paso 4: Aplicar Seed Data

1. **Abrir archivo**:
   ```bash
   open -a "TextEdit" migration/seed-data.sql
   # O:
   code migration/seed-data.sql
   ```

2. **Copiar TODO** (Cmd+A, Cmd+C)

3. **Pegar en Query Editor** y click **"Run"**

4. Deberías ver:
   ```
   INSERT 0 5  (users)
   INSERT 0 11 (event_types)
   INSERT 0 14 (providers)
   ...
   ```

### Paso 5: Verificar

En Query Editor, ejecuta:

```sql
-- Ver tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Contar registros
SELECT 'users' as tabla, COUNT(*)::text as total FROM users
UNION ALL
SELECT 'event_types', COUNT(*)::text FROM event_types
UNION ALL
SELECT 'providers', COUNT(*)::text FROM providers
UNION ALL
SELECT 'reservations', COUNT(*)::text FROM reservations;
```

Deberías ver:
```
users: 5
event_types: 11
providers: 14
reservations: 3
```

---

## ✅ Listo!

Una vez completado, marca como done:

```bash
echo "✅ Fase 1 completada 100%: $(date)" >> migration/progress.log
```

Y continúa con:

```bash
cat migration/FASE_2_N8N.md
```

---

## 🐛 Troubleshooting

### No puedo abrir Query Editor
- **Causa**: Necesitas tener permisos en AWS Console
- **Solución**: Verifica que estés logueado con la cuenta correcta

### Error: "Can't connect to database"
- **Causa**: Query Editor puede necesitar tiempo para configurarse
- **Solución**: Espera 5 minutos y reintenta

### Error al ejecutar SQL
- **Causa**: Sintaxis SQL o permisos
- **Solución**: Copia/pega cuidadosamente, verifica que no falte nada

---

## 💡 Alternativa: Script Automático con S3

Si Query Editor no funciona, ejecuta:

```bash
./migration/apply-via-s3.sh
```

Este script:
1. Sube SQL a S3 ✅ (ya hecho)
2. Te da instrucciones de cómo conectarte a EC2
3. Comandos para ejecutar en EC2

---

¿Prefieres usar Query Editor (navegador) o necesitas que creemos otra solución?
