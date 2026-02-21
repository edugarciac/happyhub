# Fase 0: Backup de Airtable - Guía Paso a Paso

**Objetivo**: Exportar todos los datos de Airtable a CSV antes de la migración.

**Duración estimada**: 30-60 minutos

**Fecha de inicio**: 2025-02-18

---

## 📋 Checklist Pre-Backup

- [ ] Acceso a Airtable con permisos de administrador
- [ ] Conocer el Base ID y nombres de todas las tablas
- [ ] Espacio en disco: al menos 500 MB libre
- [ ] Conexión a internet estable

---

## 🗂️ Paso 1: Identificar tus Bases y Tablas de Airtable

### 1.1. Acceder a Airtable

```bash
# Abrir Airtable en el navegador
open https://airtable.com/
```

### 1.2. Identificar Base ID

1. Ve a tu workspace de HappyHub
2. Abre la base principal (probablemente "HappyHub" o "Reservations")
3. La URL será algo como: `https://airtable.com/appXXXXXXXXXXXXXX/tblYYYYYYYYYYYYYY`
4. El Base ID es: `appXXXXXXXXXXXXXXX`

**Anótalo aquí**:
```
Base ID: app________________
Base Name: ___________________
```

### 1.3. Listar todas las tablas

Probablemente tienes estas tablas (según tu workflow n8n):
- [ ] Reservations
- [ ] Users
- [ ] Providers
- [ ] Services
- [ ] EventTypes
- [ ] Payments (si existe)
- [ ] ContactMessages (si existe)

**Anota las tablas que realmente tienes**:
```
1. ___________________
2. ___________________
3. ___________________
4. ___________________
5. ___________________
```

---

## 📥 Paso 2: Exportar cada Tabla a CSV

### Método 1: Export desde Airtable UI (Recomendado)

Para cada tabla, sigue estos pasos:

#### 2.1. Abrir la tabla
- Click en el nombre de la tabla en el sidebar izquierdo

#### 2.2. Seleccionar vista "Grid view"
- Asegúrate de estar en la vista de grid (tabla)
- Si tienes filtros activos, **desactívalos** (queremos TODO)

#### 2.3. Exportar como CSV
1. Click en el menú de "..." (tres puntos) arriba a la derecha
2. Seleccionar "Download CSV"
3. O: "Extensions" → "App" → "CSV" → "Download CSV"

#### 2.4. Guardar el archivo
- Nombre sugerido: `airtable-[tabla]-[fecha].csv`
- Ejemplo: `airtable-reservations-20250218.csv`
- Guardar en: `migration/airtable-export/`

**Repetir para cada tabla**.

### Método 2: Export usando Airtable API (Alternativo)

Si tienes muchas tablas o muchos registros (>1000), usa la API:

```bash
# Ver script más abajo: export-airtable-api.sh
./migration/export-airtable-api.sh
```

---

## 📁 Paso 3: Verificar Archivos Exportados

### 3.1. Listar archivos descargados

```bash
# Ver archivos en directorio de exportación
ls -lh migration/airtable-export/
```

Deberías ver algo como:
```
airtable-reservations-20250218.csv
airtable-users-20250218.csv
airtable-providers-20250218.csv
airtable-services-20250218.csv
airtable-eventtypes-20250218.csv
```

### 3.2. Verificar contenido de cada CSV

```bash
# Ver primeras 5 líneas de cada archivo
head -5 migration/airtable-export/airtable-reservations-20250218.csv
```

**Verifica que**:
- ✅ Archivo no está vacío
- ✅ Primera línea contiene headers (nombres de columnas)
- ✅ Hay datos en las filas siguientes
- ✅ Caracteres especiales (ñ, á, etc.) se ven correctamente

### 3.3. Contar registros

```bash
# Contar registros en cada tabla (líneas - 1 header)
wc -l migration/airtable-export/*.csv
```

**Anota los números**:
```
Reservations: ___ registros
Users: ___ registros
Providers: ___ registros
Services: ___ registros
EventTypes: ___ registros
```

---

## 📸 Paso 4: Backup de Attachments (Fotos/Documentos)

Si tienes fotos o documentos adjuntos en Airtable:

### 4.1. Identificar campos con attachments
- En cada tabla, busca columnas de tipo "Attachment"
- Común en: Reservations (photos), Providers (logo), etc.

### 4.2. Descargar attachments

**Opción A: Manual** (pocos archivos)
1. Abrir cada registro
2. Click derecho en cada imagen → "Save image as..."
3. Guardar en: `migration/airtable-export/attachments/[tabla]/`

**Opción B: Automático** (muchos archivos)
```bash
# Usar script de descarga (ver más abajo)
./migration/download-airtable-attachments.sh
```

---

## 💾 Paso 5: Crear Backup Comprimido

### 5.1. Comprimir todos los exports

```bash
# Crear archivo tar.gz con fecha
cd migration
tar -czf backups/airtable-backup-$(date +%Y%m%d-%H%M%S).tar.gz airtable-export/

# Verificar que se creó correctamente
ls -lh backups/
```

### 5.2. Guardar copia en ubicación segura

```bash
# Copiar a OneDrive/iCloud/Dropbox como backup adicional
cp backups/airtable-backup-*.tar.gz ~/Library/CloudStorage/OneDrive-Allianz/Backups/
```

---

## 📊 Paso 6: Documentar Estructura de Datos

### 6.1. Crear documento de schema

Crea un archivo de texto con la estructura de cada tabla:

```bash
# Crear archivo de documentación
touch migration/airtable-schema.txt
```

Para cada tabla, documenta:
```
TABLA: Reservations
CAMPOS:
- id (Primary key, auto)
- nombre (Text)
- email (Email)
- telefono (Phone)
- fecha (Date)
- hora (Single select: mañana/tarde/noche)
- num_personas (Number)
- tipo_evento (Link to EventTypes)
- precio_total (Currency)
- estado (Single select: pendiente/confirmada/cancelada)
- stripe_payment_id (Text)
- google_calendar_id (Text)
- notas (Long text)
- created_at (Created time)
- updated_at (Last modified time)

TOTAL REGISTROS: 47
```

Repite para cada tabla.

---

## ✅ Paso 7: Checklist de Verificación Final

Antes de continuar a Fase 1, verifica:

- [ ] Todos los CSV exportados están en `migration/airtable-export/`
- [ ] Cada CSV tiene datos (no vacío)
- [ ] Backup comprimido creado en `migration/backups/`
- [ ] Copia de seguridad guardada fuera del proyecto
- [ ] Schema documentado en `migration/airtable-schema.txt`
- [ ] Attachments descargados (si aplica)
- [ ] Número total de registros anotado

**Ejecutar script de verificación**:
```bash
./migration/verify-backup.sh
```

Si todo está ✅, puedes continuar a **Fase 1: Crear Aurora PostgreSQL**.

---

## 🔧 Scripts de Ayuda

Los siguientes scripts te ayudarán con el proceso:

### Script 1: `verify-backup.sh`
Verifica que todos los archivos necesarios existen.

### Script 2: `export-airtable-api.sh`
Exporta datos usando Airtable API (alternativo al método manual).

### Script 3: `download-airtable-attachments.sh`
Descarga automáticamente todos los attachments.

Ver scripts en la siguiente sección.

---

## 📝 Notas Importantes

### ⚠️ Seguridad
- **NO subir CSVs a GitHub** (ya están en .gitignore)
- **NO compartir exports** (contienen datos personales)
- **Eliminar backups** después de migración exitosa (GDPR)

### 📅 Fecha de Backup
- Fecha: ___________
- Hora: ___________
- Ejecutado por: ___________

### 🐛 Troubleshooting

**Problema**: CSV con caracteres raros (�)
- **Solución**: Exportar con encoding UTF-8
- En Excel: "Save As" → "CSV UTF-8"

**Problema**: Archivo muy grande (>100 MB)
- **Solución**: Exportar en partes usando filtros
- O usar Airtable API con paginación

**Problema**: Faltan registros en export
- **Solución**: Verificar que no hay filtros activos en la vista
- Usar vista "All records"

---

## ➡️ Siguiente Paso

Una vez completado el backup:

```bash
# Marcar Fase 0 como completada
echo "✅ Fase 0 completada: $(date)" >> migration/progress.log

# Continuar con Fase 1
cat docs/aws/PLAN_MIGRACION_A_AWS.md | grep -A 50 "Fase 1"
```

O ejecuta el checklist de migración:
```bash
./scripts/migration-checklist.sh
```

---

## 📞 ¿Necesitas Ayuda?

Si encuentras problemas:
1. Revisar sección Troubleshooting arriba
2. Consultar `docs/aws/PLAN_MIGRACION_A_AWS.md`
3. Verificar logs en `migration/logs/`
