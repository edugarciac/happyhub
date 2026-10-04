## Context

`update-hero-opening-badge` añadió un pill naranja con la fecha de apertura, descrito como "deliberadamente temporal". La fecha ya ha pasado.

## Decisions

1. **Eliminar, no reemplazar**: se borra el `<div>` del badge completo. El H1 pasa a ser el primer elemento del bloque de contenido; no requiere ajustes de espaciado (el H1 no tiene margen superior y el contenedor está centrado verticalmente).

## Risks / Trade-offs

- Ninguno relevante; cambio puramente visual y reversible.
