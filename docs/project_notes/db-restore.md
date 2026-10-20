# Restaurar la base de datos desde un backup

Los backups diarios están en `s3://happyhub-assets/backups/YYYY-MM/happyhub_YYYY-MM-DD_HHmm.dump`
(workflow `.github/workflows/db-backup.yml`, formato `pg_dump --format=custom`).

## 1. Descargar el backup

```bash
aws s3 ls s3://happyhub-assets/backups/2026-10/
aws s3 cp s3://happyhub-assets/backups/2026-10/happyhub_2026-10-20_0015.dump .
```

## 2. Restaurar en una rama nueva de Neon (recomendado)

Nunca restaurar directamente sobre producción. En la consola de Neon crea una rama vacía
(Branches → Create branch → "Schema only" o una base vacía) y copia su cadena de conexión **directa** (sin `-pooler`).

```bash
pg_restore --no-owner --no-acl --clean --if-exists -d "postgresql://...rama-nueva..." happyhub_2026-10-20_0015.dump
```

Comprueba los datos (por ejemplo `SELECT COUNT(*) FROM reservations;`) y, si son correctos, apunta
`DATABASE_URL` de Vercel a la rama restaurada o promuévela a principal desde Neon.

## 3. Restaurar solo una tabla

```bash
pg_restore --list happyhub_2026-10-20_0015.dump | grep reservations
pg_restore --no-owner --no-acl -d "postgresql://..." -t reservations happyhub_2026-10-20_0015.dump
```

## Antes de recurrir a un backup

Neon permite volver a un punto anterior reciente (Branches → Restore) dentro de su ventana de historial,
sin perder los cambios posteriores a la copia diaria. Úsalo primero si el problema es de hace pocas horas.
