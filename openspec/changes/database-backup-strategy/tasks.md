## 1. Setup del servidor EC2 (n8n)

- [ ] 1.1 Verificar si `pg_dump` está instalado: `pg_dump --version`
- [ ] 1.2 Si no está: `sudo apt-get install -y postgresql-client`
- [ ] 1.3 Verificar que `aws` CLI está disponible: `aws --version`
- [ ] 1.4 Verificar que `DATABASE_URL` está en el entorno del proceso n8n (en `.env` de n8n o como variable de sistema)
- [ ] 1.5 Verificar que `AWS_S3_BUCKET` está seteada (valor: `happyhub-assets-prod`)
- [ ] 1.6 Verificar que `AWS_S3_REGION` está seteada (valor: `eu-west-1`)
- [ ] 1.7 Testear acceso a S3 desde EC2: `aws s3 ls s3://happyhub-assets-prod/backups/ --region eu-west-1`
- [ ] 1.8 Testear pg_dump manualmente: `pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl -f /tmp/test.dump && ls -lh /tmp/test.dump && rm /tmp/test.dump`

## 2. Importar el workflow en n8n

- [ ] 2.1 Abrir n8n UI → Menu → Import workflow
- [ ] 2.2 Importar `n8n/n8n-nodes/n8n-db-backup-cron.json` desde este repositorio
- [ ] 2.3 Revisar el nodo `EjecutarBackup` y confirmar que el comando es correcto
- [ ] 2.4 Activar el workflow (toggle "Active")

## 3. Test manual antes de activar cron

- [ ] 3.1 En n8n, ejecutar el workflow manualmente con "Execute workflow"
- [ ] 3.2 Verificar que todos los nodos se completan sin error (exitCode 0)
- [ ] 3.3 Verificar que el archivo aparece en S3: `aws s3 ls s3://happyhub-assets-prod/backups/ --recursive`
- [ ] 3.4 Verificar el tamaño del archivo (debe ser > 0 bytes)

## 4. Verificar que el backup es restaurable

- [ ] 4.1 Descargar el backup más reciente: `aws s3 cp s3://happyhub-assets-prod/backups/YYYY-MM/happyhub_YYYY-MM-DD_HHmm.dump /tmp/restore_test.dump`
- [ ] 4.2 Listar los contenidos del dump: `pg_restore --list /tmp/restore_test.dump | head -30`
- [ ] 4.3 Confirmar que aparecen las tablas principales: `users`, `reservations`, `services`, `partners`
- [ ] 4.4 Eliminar fichero temporal: `rm /tmp/restore_test.dump`

## 5. Retención (opcional, post-lanzamiento)

- [ ] 5.1 En AWS Console → S3 → `happyhub-assets-prod` → Management → Lifecycle rules
- [ ] 5.2 Crear regla: prefijo `backups/`, expirar objetos después de 90 días
- [ ] 5.3 Verificar que la regla no afecta otras carpetas del bucket (assets, facturas, etc.)

## Notas de restauración de emergencia

Si hay que restaurar la base de datos desde un backup:

```bash
# 1. Descargar el backup desde S3
aws s3 cp s3://happyhub-assets-prod/backups/YYYY-MM/happyhub_YYYY-MM-DD_HHmm.dump /tmp/restore.dump

# 2. Restaurar en una nueva base de datos Neon (crear primero en Neon Console)
pg_restore --no-owner --no-acl -d "postgresql://NEW_CONNECTION_STRING" /tmp/restore.dump

# 3. Actualizar DATABASE_URL en Vercel con el nuevo connection string
# 4. Verificar la aplicación
```
