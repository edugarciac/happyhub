## Why

La base de datos Neon contiene todos los datos críticos de HappyHub: reservas, usuarios, pagos y configuración de servicios. Actualmente no existe ningún mecanismo de backup automatizado. Si la base de datos sufriera corrupción, borrado accidental, o un problema con Neon (proveedor externo), se perdería toda la información del negocio sin posibilidad de recuperación.

Neon ofrece backups en el plan gratuito limitados a point-in-time recovery dentro de una ventana corta (24h en free tier). Esto no es suficiente como única capa de protección. Necesitamos backups externos, bajo nuestro control, almacenados en S3.

La alternativa evaluada fue migrar a Supabase, que incluye backups diarios en su free tier. Sin embargo, Supabase no aporta valor suficiente para justificar la migración: mismo motor (PostgreSQL), mismo coste operativo, y pérdida de tiempo en migración. En cambio, implementar backups directamente sobre Neon con n8n + pg_dump + S3 es gratis, encaja perfectamente en el stack existente y da control total sobre la retención.

## What changes

- Nuevo workflow n8n con trigger cron diario (02:00h)
- El workflow ejecuta `pg_dump` en formato custom sobre la Neon DB
- El dump se sube directamente a S3 (bucket `happyhub-assets-prod`) bajo la carpeta `backups/YYYY-MM/`
- El workflow registra éxito o error en los logs de n8n

No se modifican tablas de base de datos, API routes, ni frontend. Es infraestructura pura.

## Capabilities

### New capabilities
- `db-daily-backup`: Backup automático diario de la base de datos completa a S3
- `db-backup-retention`: Backups organizados por mes en S3 con naming `happyhub_YYYY-MM-DD_HHmm.dump`

### Modified capabilities
- Ninguna
