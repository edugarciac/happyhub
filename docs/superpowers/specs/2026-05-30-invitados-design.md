# Diseño: Sección Invitados — Dashboard Mis Eventos

**Fecha:** 2026-05-30  
**Scope:** Bloque 3 del dashboard `/mis-eventos/[id]` — sección `?section=invitados`  
**Depende de:** Bloques 1 y 2 (dashboard shell + timeline) ya implementados

---

## Contexto

La sección Invitados reemplaza el placeholder actual de la sección `invitados` en el dashboard. Reutiliza la tabla `collaborative_event_participants` existente (name, email, role, rsvp_status) añadiendo soporte para invitaciones personalizadas por email, alta masiva desde Excel y una página pública de RSVP sin login.

---

## Flujo de invitación

**Opción A — Enlace compartido (ya existe):** El organizador comparte `happyhub.es/unirse/[invite_code]`. Los invitados entran, escriben su nombre y quedan como `rsvp_status: pending`.

**Opción B — Invitación personal:** El organizador añade un invitado con nombre + email. El sistema genera un `invite_token` único y envía un email con el enlace `/invitacion/[token]` donde el invitado puede confirmar sin login.

**Alta masiva:** El organizador sube un Excel con columnas `nombre` y `email`. El sistema valida, muestra vista previa e importa los válidos, ignorando filas con email inválido.

---

## Cambios de base de datos

```sql
-- Migración: 012_invitados_tokens.sql
ALTER TABLE collaborative_event_participants
  ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rsvp_note TEXT;

CREATE INDEX IF NOT EXISTS idx_participants_invite_token ON collaborative_event_participants(invite_token);
```

---

## API endpoints

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/events/collaborative/[id]/guests` | Lista invitados del evento | sesión |
| POST | `/api/events/collaborative/[id]/guests` | Añadir invitado (genera token, envía email si hay email) | sesión organizador |
| DELETE | `/api/events/collaborative/[id]/guests/[guestId]` | Eliminar invitado | sesión organizador |
| POST | `/api/events/collaborative/[id]/guests/resend` | Reenviar invitación email | sesión organizador |
| POST | `/api/events/collaborative/[id]/guests/import` | Importar desde Excel (multipart) | sesión organizador |
| GET | `/api/rsvp/[token]` | Obtener datos del invitado y evento (público) | sin auth |
| POST | `/api/rsvp/[token]` | Confirmar RSVP (confirmed/declined/maybe + nota) | sin auth |

### POST `/api/events/collaborative/[id]/guests`

```typescript
// Body
{ name: string; email?: string }

// Lógica:
// 1. Generar invite_token = crypto.randomBytes(32).toString('hex')
// 2. INSERT en collaborative_event_participants
// 3. Si hay email → enviar email con link /invitacion/[token] via email.ts
// 4. Retornar participante creado
```

### POST `/api/events/collaborative/[id]/guests/import`

```typescript
// multipart/form-data: campo "file" → .xlsx / .xls
// Usar excelManager.ts para parsear
// Columnas esperadas: "nombre" o "name", "email" (case-insensitive)
// Validación: email válido (regex) o ausente
// Respuesta: { imported: number, skipped: number, errors: string[] }
// Por cada fila válida: INSERT + enviar email si tiene email
```

### GET + POST `/api/rsvp/[token]`

```typescript
// GET: buscar participante por invite_token, devolver { participant, event } (sin datos sensibles)
// POST body: { status: 'confirmed' | 'declined' | 'maybe', note?: string }
// UPDATE rsvp_status, rsvp_note WHERE invite_token = token
// Sin autenticación — token actúa como credencial
```

---

## Componentes

### `GuestList.tsx` — sección del dashboard

**Props:** `{ eventId, isOrganizer, inviteCode }`

**Estructura:**
```
GuestList
├── Stats bar (confirmados / pendientes / declinados)
├── Enlace de invitación (copia al portapapeles)
├── Tabs: [+ Añadir uno] [📊 Importar Excel]
│   ├── Tab individual: input nombre + email + botón Añadir
│   └── Tab Excel: ExcelImporter (subcomponente)
└── Tabla de invitados
    ├── Columnas: Nombre · Email · RSVP · Invit. · Acciones
    ├── Badge RSVP por color (verde/ámbar/rojo/gris)
    ├── Botón "Reenviar" si tiene email y está pendiente
    └── Botón ✕ para eliminar (confirm dialog)
```

### `ExcelImporter.tsx` — subcomponente

- Zona drag & drop (acepta .xlsx, .xls)
- `POST /api/.../guests/import` con FormData
- Muestra tabla de vista previa con estado por fila (ok / sin email / email inválido)
- Botón "Importar N válidos"
- Enlace "Descargar plantilla" → archivo estático `/templates/invitados-plantilla.xlsx`

---

## Página pública RSVP

**Ruta:** `src/pages/invitacion/[token].tsx`  
**Sin layout de HappyHub** — página standalone con logo y diseño limpio.

```
/invitacion/[token]
├── getServerSideProps: GET /api/rsvp/[token] → { participant, event }
│   └── Token inválido → página "Enlace no válido"
│   └── Ya respondido → mostrar respuesta actual con opción de cambiar
├── Nombre del evento + fecha + ubicación
├── "Hola [nombre], ¿vendrás?"
├── Botones: ✓ Confirmo · ✗ No puedo · 🤔 Quizás
├── Input nota opcional
└── Tras responder: mensaje de confirmación con resumen
```

---

## Plantilla Excel

Crear `public/templates/invitados-plantilla.xlsx` — archivo estático con:
- Columna A: `nombre` (header + 3 filas de ejemplo)
- Columna B: `email` (header + 3 filas de ejemplo)

---

## Email de invitación

Usar `src/lib/email.ts` existente con plantilla:

```
Asunto: Te invita a [nombre del evento]
Cuerpo:
  [nombre del invitado], has sido invitado a [evento]
  📅 [fecha] · 📍 [ubicación]
  [Botón CTA: Confirmar asistencia → /invitacion/[token]]
```

---

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `database/migrations/012_invitados_tokens.sql` | Crear |
| `src/pages/api/events/collaborative/[id]/guests.ts` | Crear (GET + POST) |
| `src/pages/api/events/collaborative/[id]/guests/[guestId].ts` | Crear (DELETE) |
| `src/pages/api/events/collaborative/[id]/guests/resend.ts` | Crear (POST) |
| `src/pages/api/events/collaborative/[id]/guests/import.ts` | Crear (POST multipart) |
| `src/pages/api/rsvp/[token].ts` | Crear (GET + POST público) |
| `src/pages/invitacion/[token].tsx` | Crear (página pública RSVP) |
| `src/components/events/GuestList.tsx` | Crear (sección dashboard) |
| `src/components/events/ExcelImporter.tsx` | Crear (subcomponente) |
| `src/pages/mis-eventos/[id].tsx` | Modificar (conectar sección invitados) |
| `public/templates/invitados-plantilla.xlsx` | Crear (plantilla estática) |

---

## Lo que NO entra en este spec

- Mensajes WhatsApp a invitados (sección Mensajes, spec separado)
- Recordatorios automáticos (sección Recordatorios / Detalles)
- Restricciones dietéticas avanzadas (el campo `rsvp_note` cubre lo básico)
