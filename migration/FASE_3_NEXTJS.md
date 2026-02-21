# Fase 3: Actualizar Next.js para PostgreSQL - Guía Paso a Paso

**Objetivo**: Migrar código de Airtable a PostgreSQL en tu app Next.js.

**Duración estimada**: 2-3 horas

**Pre-requisito**: Aurora PostgreSQL desplegado ✅

---

## 🎯 Resultado Final

Al terminar esta fase tendrás:
- ✅ Biblioteca de conexión PostgreSQL (`src/lib/db.ts`)
- ✅ Schema aplicado desde la aplicación
- ✅ API routes actualizadas para usar PostgreSQL
- ✅ Queries reemplazando llamadas a Airtable
- ✅ Testing local funcionando

---

## 📦 Paso 1: Instalar Dependencias

Ya tenemos `pg` instalado. Verificamos:

```bash
npm list pg
```

Si no está:
```bash
npm install pg @types/pg
```

---

## 🔧 Paso 2: Crear Biblioteca de Conexión

Crear `src/lib/db.ts` con pool de conexiones PostgreSQL.

---

## 🗄️ Paso 3: Aplicar Schema (Desde la App)

Crear API route temporal que aplique el schema la primera vez.

---

## 🔄 Paso 4: Actualizar API Routes

Reemplazar llamadas a Airtable por queries PostgreSQL:
- `/api/webhook-reserva` - Guardar en PostgreSQL
- `/api/auth` - Verificar usuarios desde PostgreSQL

---

## ✅ Paso 5: Testing Local

Probar que todo funciona:
- Crear reserva
- Login de usuario
- Verificar datos en PostgreSQL

---

Comenzamos con el código. ¿Listo?
