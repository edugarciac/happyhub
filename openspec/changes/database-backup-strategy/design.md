## Context

Neon Postgres es el único almacén persistente de HappyHub. No hay réplica, no hay backup externo. El bucket S3 `happyhub-assets-prod` ya existe y está configurado con credenciales IAM en el servidor EC2 donde corre n8n. El servidor EC2 tiene AWS CLI instalado (lo usan los workflows de n8n).

El objetivo es el mínimo viable: backup diario automatizado que no cueste nada adicional y no requiera tocar el código de la aplicación.

## Goals / Non-Goals

**Goals:**
- Backup diario completo de la base de datos en formato binario (`--format=custom`)
- Almacenamiento en S3, organizado por mes para facilitar la navegación
- Visibilidad del resultado (éxito/fallo) en los logs de n8n
- Sin coste adicional (usa infraestructura ya existente)

**Non-Goals:**
- Backup incremental o WAL shipping (Neon ya lo hace internamente)
- Alertas activas por fallo (los logs de n8n son suficiente para la fase inicial)
- Restauración automatizada (proceso manual documentado en tasks.md)
- Cifrado adicional del dump (Neon connection string usa TLS; S3 cifra at-rest por defecto)
- Retención automática con S3 Lifecycle Rules (se puede añadir después desde la consola AWS)

## Decisions

### 1. Formato del dump: `--format=custom`

**Decision**: Usar `pg_dump --format=custom` (formato binario comprimido de PostgreSQL).

**Rationale**: Es el formato recomendado para backups completos. Produce archivos más pequeños que SQL plano, permite restauración selectiva por tabla con `pg_restore -t`, y es más rápido de generar y restaurar. Alternativa `--format=plain` produce SQL legible pero archivos mayores y sin restauración selectiva.

### 2. Transporte: pipe directo a S3

**Decision**: `pg_dump ... | aws s3 cp - s3://bucket/key` — sin escribir a disco.

**Rationale**: El servidor EC2 no necesita espacio en disco para el dump. El pipe elimina un paso (escribir + leer + borrar fichero temporal). AWS CLI con `-` como source lee desde stdin. Para la base de datos actual (pequeña), esto es perfectamente fiable.

**Alternativa rechazada**: Escribir a `/tmp/backup.dump`, subir con AWS CLI, borrar. Más pasos, más probabilidad de fallo silencioso, y requiere gestionar el fichero temporal.

### 3. Naming convention: `backups/YYYY-MM/happyhub_YYYY-MM-DD_HHmm.dump`

**Decision**: Prefijo mensual para agrupar por mes, filename con fecha y hora completa.

**Rationale**: S3 no tiene directorios reales, pero los prefijos con `/` se muestran como carpetas en la consola. Agrupar por mes facilita navegar y aplicar Lifecycle Rules después. La hora en el nombre evita colisiones si el workflow se ejecuta manualmente dos veces en el mismo día.

### 4. Infraestructura de ejecución: n8n Execute Command en EC2

**Decision**: Usar el nodo `Execute Command` de n8n para lanzar el comando shell directamente en el servidor EC2.

**Rationale**: n8n ya corre en EC2 con AWS CLI configurado. No necesitamos Lambda, cron jobs del sistema operativo, ni servicios adicionales. El nodo Execute Command hereda el entorno del proceso n8n, que incluye las variables de entorno del servidor.

**Requisito**: `pg_dump` (paquete `postgresql-client`) debe estar instalado en el servidor EC2. AWS CLI ya está instalado (verificado, se usa en otros workflows).

**Alternativa rechazada**: Usar el nodo PostgreSQL de n8n para exportar tabla a tabla. Descartado porque no exporta DDL, constraints, índices, ni secuencias — no es un backup real.

### 5. Variables de entorno en el comando

**Decision**: Las credenciales sensibles (`DATABASE_URL`, `AWS_S3_BUCKET`, `AWS_S3_REGION`) se leen como variables de entorno del shell (`$DATABASE_URL`), no como literales en el workflow JSON.

**Rationale**: Las variables de entorno del servidor EC2 no aparecen en el JSON del workflow exportado de n8n. Si el workflow JSON se comparte o sube a GitHub, las credenciales no quedan expuestas. El único valor dinámico que se inyecta via expresión n8n (`{{ $json.s3Key }}`) es la clave S3, que no es sensible.

### 6. Detección de éxito: exit code del proceso

**Decision**: El nodo `VerificarResultado` lee `$json.exitCode`. Exit code 0 = éxito, cualquier otro = fallo. El workflow bifurca en `EsExitoso` (If node) para registrar el resultado apropiado.

**Rationale**: Es la forma estándar de detectar éxito en comandos shell. El nodo Execute Command de n8n expone `exitCode`, `stdout`, y `stderr` como campos del item de salida.

## Risks / Trade-offs

- **pg_dump no instalado en EC2**: El workflow fallará la primera vez. Mitigación: el task de setup incluye verificar e instalar `postgresql-client` antes de activar el workflow.
- **DATABASE_URL no seteada en el entorno n8n**: El comando falla silenciosamente con un dump vacío o error. Mitigación: verificar la variable antes de activar, testear manualmente una vez.
- **Tamaño del dump crece con el tiempo**: S3 cobra por almacenamiento. Con la base de datos actual (pequeña), coste es céntimos. Mitigación: añadir S3 Lifecycle Rule después para expirar backups con más de 90 días.
- **Fallo de red durante el pipe**: Si la conexión a Neon o a S3 se interrumpe, el backup queda incompleto. AWS CLI detecta esto y devuelve exit code distinto de 0, por lo que el workflow lo marca como fallo. El backup corrupto no se guarda completo en S3 (AWS CLI hace multipart upload atómico).
