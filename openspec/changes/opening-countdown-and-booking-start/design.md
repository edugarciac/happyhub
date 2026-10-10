## Decisions

1. **Una única fuente de verdad**: `OPENING_DATE = '2026-10-16'` en `src/config/opening.ts`, que usan el popup, el Hero, el calendario y la API.
2. **Zona horaria Europe/Madrid** para contar los días: el contador cambia a medianoche hora de España, sea cual sea la zona horaria del visitante.
3. **Cálculo en cliente** (`useDaysUntilOpening`, que se refresca cada minuto): evita que el HTML servido muestre un número desfasado y que haya desajustes de hidratación. Antes de montar no se pinta nada.
4. **Validación doble**: el calendario impide seleccionar días anteriores a la inauguración y la API los rechaza, por si alguien envía la petición a mano.
5. **Desaparición automática** tras la inauguración (días < 0). No hace falta otro despliegue el día 17.
6. Se reutiliza el componente/slot del popup existente (`ComingSoonOverlay`) en lugar de crear otro, para no tener dos popups de entrada. Cambia la clave de `sessionStorage` para que lo vean de nuevo quienes cerraron el popup antiguo.

## Risks / Trade-offs

- Mientras siga activa la lista de cuentas autorizadas, el botón "Ver fechas disponibles" del popup lleva al calendario público, pero solo las cuentas autorizadas pueden completar la reserva.
