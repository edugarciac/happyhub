## Decisions

1. **Campo de texto propio + selector nativo oculto sobre el icono**: el texto controla el formato visible; el selector nativo (opacidad 0 sobre el icono, con `showPicker()` cuando existe) da el calendario del sistema en móvil y escritorio sin librerías nuevas.
2. **Misma interfaz que el input nativo** (`value`, `onChange(e.target.value)`, `name`, `min`, `max`): el cambio en las páginas es casi solo de etiqueta.
3. **Validación**: solo emite valores completos y reales (rechaza 31/02) y dentro de `min`/`max`; si no, marca "Fecha no válida" y deja el valor vacío.
4. **Sincronización externa**: si el valor cambia desde fuera (reset, selector nativo), el texto se actualiza.

## Risks / Trade-offs

- El calendario emergente nativo sigue mostrando el idioma y la región del dispositivo, pero la fecha elegida se ve en dd/mm/aaaa en el campo.
