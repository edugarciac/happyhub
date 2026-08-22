#!/bin/bash

# Script para aplicar schema SQL desde EC2 n8n
# Este script se ejecuta EN el servidor EC2, no en tu Mac

# Configuración — set these via environment variables or a .env file
DB_HOST="${DB_HOST:?Set DB_HOST}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-happyhub}"
DB_USER="${DB_USER:?Set DB_USER}"
DB_PASSWORD="${DB_PASSWORD:?Set DB_PASSWORD}"

echo "════════════════════════════════════════════════════════════"
echo "  Aplicando Schema SQL a Aurora desde EC2"
echo "════════════════════════════════════════════════════════════"
echo ""

# Verificar si psql está instalado
if ! command -v psql &> /dev/null; then
    echo "📦 Instalando PostgreSQL client..."
    sudo apt-get update -qq
    sudo apt-get install -y postgresql-client
    echo "✅ PostgreSQL client instalado"
fi

# Test conexión
echo "🔌 Probando conexión a Aurora..."
export PGPASSWORD="$DB_PASSWORD"

if psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Conexión exitosa"
else
    echo "❌ Error de conexión a Aurora"
    echo "Verifica que:"
    echo "  - Aurora esté en estado 'available'"
    echo "  - Security group permita puerto 5432 desde esta EC2"
    exit 1
fi

# Descargar archivos SQL desde GitHub o crear inline
echo ""
echo "📝 Aplicando schema.sql..."

# Aplicar schema (aquí pondrías el SQL completo o lo descargas)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME <<'EOF'
-- Tu schema SQL completo aquí
-- O descarga: wget https://raw.githubusercontent.com/tu-repo/happyhub/main/migration/schema.sql
EOF

if [ $? -eq 0 ]; then
    echo "✅ Schema aplicado"
else
    echo "❌ Error aplicando schema"
    exit 1
fi

# Aplicar seed data
echo ""
echo "🌱 Aplicando seed-data.sql..."

psql -h $DB_HOST -U $DB_USER -d $DB_NAME <<'EOF'
-- Tu seed data SQL completo aquí
EOF

if [ $? -eq 0 ]; then
    echo "✅ Seed data aplicado"
else
    echo "❌ Error aplicando seed data"
    exit 1
fi

# Verificar
echo ""
echo "🔍 Verificando tablas creadas..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"

echo ""
echo "🔍 Verificando datos..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME <<'EOF'
SELECT 'Users:' as tabla, COUNT(*)::text as total FROM users
UNION ALL
SELECT 'Event Types:', COUNT(*)::text FROM event_types
UNION ALL
SELECT 'Providers:', COUNT(*)::text FROM providers
UNION ALL
SELECT 'Reservations:', COUNT(*)::text FROM reservations;
EOF

echo ""
echo "════════════════════════════════════════════════════════════"
echo "           ✅ TODO COMPLETADO EXITOSAMENTE"
echo "════════════════════════════════════════════════════════════"
