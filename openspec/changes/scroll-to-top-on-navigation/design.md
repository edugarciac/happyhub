## Decisions

1. **Quitar el estilo global** en lugar de forzar el scroll en cada navegación: deja que Next.js haga su comportamiento estándar (subir arriba al cambiar de página) sin animaciones que lo interrumpan.
2. **Scroll arriba ligado a `state.step`** en el proveedor de la reserva, así cubre avanzar, retroceder y saltar a un paso desde cualquier componente.
