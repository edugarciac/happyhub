#!/bin/bash
# Apply schema using AWS CloudShell
# Instructions:
# 1. Open AWS CloudShell from AWS Console: https://eu-west-1.console.aws.amazon.com/cloudshell
# 2. Upload this script, schema-simple.sql, and seed-data.sql
# 3. Run: bash apply-via-cloudshell.sh

echo "📦 Installing PostgreSQL client..."
sudo yum install -y postgresql

echo "🔌 Connecting to Aurora..."
export PGPASSWORD='c0MAkvDuZ6yWhfUUzgMh'

echo "📝 Applying schema..."
psql -h happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com \
  -U dbadmin \
  -d happyhub \
  -f schema-simple.sql

echo "🌱 Applying seed data..."
psql -h happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com \
  -U dbadmin \
  -d happyhub \
  -f seed-data.sql

echo "✅ Verifying..."
psql -h happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com \
  -U dbadmin \
  -d happyhub \
  -c "SELECT COUNT(*) as users FROM users; SELECT COUNT(*) as event_types FROM event_types; SELECT COUNT(*) as providers FROM providers;"

echo ""
echo "🎉 Schema aplicado correctamente!"
