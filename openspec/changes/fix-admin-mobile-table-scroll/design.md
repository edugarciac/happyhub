## Context

El resto de tablas admin (`clients`, `reservations`, `reviews`, `pricing`, `holidays`, `reservation-services`, `DataTable`) ya usan el patrón `<div className="overflow-x-auto"><table>`. Estas cuatro no.

## Decisions

1. **Mismo patrón existente** (`overflow-x-auto` alrededor de la tabla) en vez de rediseñar a tarjetas en móvil: arreglo mínimo, consistente con el resto del admin.
2. Se mantiene el `overflow-hidden` del contenedor exterior (para respetar los bordes redondeados); el scroll lo hace el wrapper interior.

3. **Partners: tarjetas en móvil**. Es la pantalla que más se usa desde el móvil, así que bajo `md` se muestra una lista de tarjetas (`md:hidden`) y la tabla pasa a `hidden md:block`. Botones con área táctil mayor (`p-3`, iconos 20px).

## Risks / Trade-offs

- Las otras tres tablas solo ganan scroll horizontal (no tarjetas). Si se usan a menudo en móvil, aplicar el mismo patrón después.
- Partners tiene dos marcados (tarjeta y fila) que hay que mantener sincronizados.
