## Why

En la columna de acciones del listado de reservas (`/admin/reservations`) llegan a aparecer hasta 9 iconos sin texto (WhatsApp, email, reenviar correo, cobros adicionales, editar, señal recibida, cobro del día, cancelar, eliminar). Varios son muy parecidos (dos rojos de "borrar", dos verdes, varios de pagos) y solo se distinguen con el tooltip, que no existe en móvil. Es fácil equivocarse de acción.

## What Changes

- Mantener visibles como icono solo las acciones universalmente reconocibles: WhatsApp, Email y Editar
- Agrupar el resto en un menú desplegable "Más" con icono + texto descriptivo, organizado por secciones:
  - **Comunicación**: Reenviar correo de la reserva
  - **Pagos**: Señal recibida (Bizum), Cobros adicionales, Cobro del día y fianza
  - **Peligro** (rojo, separado): Cancelar y quitar del calendario, Eliminar reserva
- El menú se posiciona con `position: fixed` para no quedar recortado por el scroll horizontal de la tabla, y se cierra con clic fuera, Escape o scroll
- Las condiciones de visibilidad de cada acción no cambian

## Capabilities

### Modified Capabilities

- `admin-reservations`: la fila de reserva muestra acciones secundarias con etiqueta de texto en un menú agrupado

## Impact

- **Frontend**: `src/pages/admin/reservations/index.tsx`, nuevo componente `src/components/admin/RowActionsMenu.tsx`
- Sin cambios en API, base de datos ni lógica de negocio
