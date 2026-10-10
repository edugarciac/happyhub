## Decisions

1. **Llamar como función** (cambio mínimo y ya usado en el proyecto) en vez de sacar los campos a componentes externos con props.
2. **Prefijo `render`** en el nombre para que nadie lo vuelva a usar como `<Componente />`.
3. **Test de regresión estático**, porque el proyecto no tiene ESLint configurado (la regla equivalente sería `react/no-unstable-nested-components`). Se ha comprobado que falla con el código anterior.
