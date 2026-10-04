## Why

En el admin de Partners, el único botón rápido junto a cada partner era la papelera, que **borra** el partner definitivamente. Para pausar un partner había que entrar en Editar y desmarcar "Activo". Es fácil borrar por error cuando lo que se quería era desactivar.

## What Changes

- Botón rápido de activar/desactivar (icono Power) en cada tarjeta (móvil) y fila (escritorio), en lugar de la papelera
- El borrado pasa a estar solo dentro del modal de Editar, con confirmación que avisa de que es irreversible y sugiere desactivar

## Capabilities

### Modified Capabilities

- `admin-partners`: activar/desactivar en un toque; borrado menos accesible

## Impact

- **Frontend**: `src/pages/admin/partners.tsx`
- **API**: sin cambios, se reutiliza `PUT /api/admin/partners` (ya acepta `active`)
- Un partner inactivo deja de mostrarse en `/partners` (ya filtra `active = true`)
