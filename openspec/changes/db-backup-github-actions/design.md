## Decisions

- **GitHub Actions** en lugar de un cron de Vercel: las funciones de Vercel no traen `pg_dump` ni deben correr procesos largos; Actions tiene cron gratuito, logs y aviso por email al fallar.
- **Conexión directa de Neon** (`DATABASE_URL_BACKUP`, host sin `-pooler`): `pg_dump` puede fallar a través del pooler en modo transacción.
- **Verificar antes de subir** (`pg_restore --list`): un backup que no se puede restaurar no es un backup.
- **pg_dump 17**: dumpea servidores de versiones anteriores; si Neon pasa a una versión mayor, el job falla de forma visible y se sube la versión del cliente.
- **Retención** con una regla de ciclo de vida de S3 (borrar `backups/` a los 90 días), configurada en la consola de AWS.
- **Usuario IAM dedicado** con solo `s3:PutObject` sobre `backups/*`: si el secreto se filtra, no permite leer ni borrar.
