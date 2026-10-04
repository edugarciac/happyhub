## Decisions

1. **Reutilizar PUT** enviando el partner completo con `active` invertido, porque el endpoint actualiza todas las columnas. No hace falta un endpoint PATCH nuevo.
2. **Actualización local** del estado tras el OK del servidor (sin recargar la lista entera), para que el cambio se vea al instante.
3. **Icono Power**: verde = activo, gris = inactivo. Además se mantiene el badge "Activo/Inactivo" como texto.
4. **Eliminar dentro de Editar**: botón rojo a la izquierda del pie del modal. Al pulsarlo se cierra el modal y aparece la confirmación de siempre.

## Risks / Trade-offs

- PUT con el objeto completo: si otro admin editó el partner justo antes, se sobrescribirían sus cambios. Aceptable (un solo admin en la práctica).
