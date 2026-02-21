# Solución Final: Aplicar Schema desde Next.js Local

**Método más simple que funciona**: Ejecutar desde tu código Next.js.

**Duración**: 5 minutos

---

## ✅ Archivos SQL Ya Subidos a S3

Los archivos ya están en S3, accesibles desde cualquier recurso AWS:
- ✅ `s3://happyhub-assets-prod/migration/schema-simple.sql`
- ✅ `s3://happyhub-assets-prod/migration/seed-data.sql`

---

## 🚀 Opción Más Práctica: Ejecuta estos comandos

```bash
# 1. Instalar pg si no está (ya lo hiciste)
npm install pg

# 2. Crear script simple de setup
cat > setup-db-now.js <<'EOF'
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace('?sslmode=require', ''),
  ssl: false
});

async function setup() {
  const client = await pool.connect();
  try {
    console.log('✅ Conectado a Aurora');

    // Schema
    const schema = fs.readFileSync('migration/schema-simple.sql', 'utf8');
    await client.query(schema);
    console.log('✅ Schema aplicado');

    // Seed
    const seed = fs.readFileSync('migration/seed-data.sql', 'utf8');
    await client.query(seed);
    console.log('✅ Seed data aplicado');

    // Verify
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Users: ${result.rows[0].count}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
EOF

# 3. Ejecutar
node setup-db-now.js
```

Si te da error de conexión, prueba esto:

```bash
# Actualizar .env.local para quitar sslmode temporalmente
sed -i.bak 's/?sslmode=require//' .env.local

# Ejecutar de nuevo
node setup-db-now.js

# Restaurar .env.local
mv .env.local.bak .env.local
```

---

## 🎯 ¿Probamos esto ahora?

Es la forma más directa. Tu aplicación se conectará a Aurora (que permite conexiones desde cualquier IP gracias al security group) y aplicará el schema.

¿Ejecuto los comandos por ti?
