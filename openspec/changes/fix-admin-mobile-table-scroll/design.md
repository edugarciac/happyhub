## Context

El resto de tablas admin (`clients`, `reservations`, `reviews`, `pricing`, `holidays`, `reservation-services`, `DataTable`) ya usan el patrón `<div className="overflow-x-auto"><table>`. Estas cuatro no.

## Decisions

1. **Mismo patrón existente** (`overflow-x-auto` alrededor de la tabla) en vez de rediseñar a tarjetas en móvil: arreglo mínimo, consistente con el resto del admin.
2. Se mantiene el `overflow-hidden` del contenedor exterior (para respetar los bordes redondeados); el scroll lo hace el wrapper interior.

## Risks / Trade-offs

- En móvil la tabla requiere deslizar horizontalmente para ver "Acciones". Aceptable para un panel interno; una vista en tarjetas sería mejor UX pero es un cambio mayor.
