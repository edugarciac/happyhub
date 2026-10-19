## Context

La columna de acciones usa botones icon-only con `title`. Con 9 posibles iconos de 16px y colores repetidos, el admin no distingue su función.

## Decisions

- **Patrón "acciones principales + menú desbordado"** (como Gmail/Stripe Dashboard): 3 iconos reconocibles visibles, el resto en menú con texto. Alternativa descartada: botones con texto en línea → no caben en la fila.
- **Componente genérico `RowActionsMenu`** que recibe secciones `{ title, items[] }`; los items con `hidden: true` se filtran y las secciones vacías no se muestran. Si no queda ningún item, el botón no se renderiza.
- **Posicionamiento `fixed`** calculado desde `getBoundingClientRect()` del botón, alineado a la derecha y abriéndose hacia arriba si no cabe abajo. La tabla tiene `overflow-x-auto`, que recortaría un dropdown `absolute`.
- **Cierre** con mousedown fuera, Escape, scroll o resize.

## Risks / Trades-offs

- Las acciones del menú requieren un clic extra → aceptable, son acciones menos frecuentes y así se evitan clics equivocados en acciones destructivas.
