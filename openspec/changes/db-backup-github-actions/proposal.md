## Why

El backup diario de Neon (ADR-009, `database-backup-strategy`) se ejecutaba desde n8n en un EC2. n8n ya no se usa, así que no se está haciendo ninguna copia externa: solo queda el point-in-time restore de Neon, con una ventana corta. Una pérdida o borrado de datos supondría perder reservas, clientes y pagos.

## What Changes

- Nuevo workflow de GitHub Actions `.github/workflows/db-backup.yml`, diario a las 02:15 (hora de Madrid aprox.) y lanzable a mano:
  - instala `pg_dump` 17 (PGDG)
  - hace `pg_dump --format=custom` de `DATABASE_URL`
  - **verifica** el dump con `pg_restore --list` y que no esté vacío
  - lo sube a `s3://<bucket>/backups/YYYY-MM/happyhub_YYYY-MM-DD_HHmm.dump` (misma ruta y nombre que el backup anterior)
  - si algo falla, el job falla y GitHub envía un email al propietario del repositorio
- Guía de restauración `docs/project_notes/db-restore.md`
- ADR-011 sustituye a ADR-009

## Capabilities

### Modified Capabilities

- `db-daily-backup`: se ejecuta en GitHub Actions en lugar de n8n, con verificación del dump y aviso por email si falla

## Impact

- **Infra**: nuevo workflow; secretos de GitHub `DATABASE_URL_BACKUP`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`; variables `AWS_REGION`, `BACKUP_S3_BUCKET`
- Sin cambios en la aplicación
- Coste: ~1–2 min de Actions al día (dentro del plan gratuito); S3 de pocos MB al mes
