#!/bin/bash
# Apply schema using AWS CloudShell
# Instructions:
# 1. Open AWS CloudShell from AWS Console: https://eu-west-1.console.aws.amazon.com/cloudshell
# 2. Upload this script, schema-simple.sql, and seed-data.sql
# 3. Run: bash apply-via-cloudshell.sh

echo "📦 Installing PostgreSQL client..."
sudo yum install -y postgresql

# Set DB credentials via environment variables before running this script
: "${DB_HOST:?Set DB_HOST}"
: "${DB_USER:?Set DB_USER}"
: "${DB_PASSWORD:?Set DB_PASSWORD}"
DB_NAME="${DB_NAME:-happyhub}"

echo "🔌 Connecting to Aurora..."
export PGPASSWORD="$DB_PASSWORD"

echo "📝 Applying schema..."
psql -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f schema-simple.sql

echo "🌱 Applying seed data..."
psql -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f seed-data.sql

echo "✅ Verifying..."
psql -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -c "SELECT COUNT(*) as users FROM users; SELECT COUNT(*) as event_types FROM event_types; SELECT COUNT(*) as providers FROM providers;"

echo ""
echo "🎉 Schema aplicado correctamente!"
