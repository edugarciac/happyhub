## Why

En móvil, la tabla de Partners del panel admin queda recortada: el contenedor usa `overflow-hidden` y la columna "Acciones" (editar/desactivar) es inaccesible porque no se puede hacer scroll horizontal. Otras tablas admin tienen el mismo problema.

## What Changes

- Envolver en `overflow-x-auto` las tablas admin que no lo tenían: `partners`, `event-types`, `reservations/blocked-dates`, `actividades-catalogo`
- Partners en móvil (< `md`): vista en tarjetas (logo, nombre, estado, tipo, teléfono y botones editar/eliminar siempre visibles); la tabla queda solo para escritorio
- Evitar que los iconos de acciones de Partners se partan en dos líneas (`whitespace-nowrap`)

## Capabilities

### New Capabilities

- `admin-responsive-tables`: las tablas del panel admin permiten scroll horizontal en pantallas estrechas

## Impact

- **Frontend**: 4 páginas en `src/pages/admin/`. Sin cambios de backend, DB ni APIs
