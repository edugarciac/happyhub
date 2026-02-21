# Migration Directory

Este directorio contiene scripts y datos para la migración de Vercel+Airtable a AWS.

## Estructura

```
migration/
├── README.md (este archivo)
├── airtable-export/        # Exportaciones CSV de Airtable
├── schema.sql              # Schema PostgreSQL
├── migrate-to-postgres.js  # Script de migración
└── backups/                # Backups antes de migración
```

## Uso

### 1. Exportar datos de Airtable

Ir a cada tabla en Airtable y exportar como CSV:
- https://airtable.com/appXXX/tblReservations → Export CSV
- https://airtable.com/appXXX/tblUsers → Export CSV
- etc.

Guardar todos los CSV en `migration/airtable-export/`

### 2. Crear base de datos PostgreSQL

Ver `docs/aws/PLAN_MIGRACION_A_AWS.md` - Fase 1

### 3. Ejecutar migración

```bash
npm install pg csv-parser
export DATABASE_URL="postgresql://user:pass@host:5432/db"
node migration/migrate-to-postgres.js
```

## Importante

⚠️ **NO subir a GitHub**:
- Archivos CSV con datos reales
- Connection strings con passwords
- Backups de base de datos

Estos archivos están en `.gitignore`.
