## Why

El propietario ve fechas en formato mm/dd/aaaa. Todas las fechas que muestra la web ya usan formato español (`es-ES`, `dd/MM/yyyy`), pero los campos `<input type="date">` los dibuja el navegador según la **región del dispositivo**: en un dispositivo con región EE. UU. salen como 10/17/2026. La web no puede cambiar eso en el campo nativo.

## What Changes

- Nuevo componente `DateInput` (`src/components/DateInput.tsx`): sustituto directo de `<input type="date">` que **siempre muestra dd/mm/aaaa**, con barras automáticas y teclado numérico. Mantiene el valor interno en `YYYY-MM-DD`. Un icono de calendario abre el selector nativo del dispositivo.
- Helpers puros en `src/utils/dateInput.ts` (`isoToDisplay`, `formatTyping`, `displayToIso`) con tests.
- Sustituidos los 10 campos de fecha: admin de reservas (filtros y edición), crear reserva, bloquear fechas, festivos, tarifas y crear evento (clientes).

## Fuera de alcance

- `ReservationForm.tsx`: no se usa en ninguna página.

## Impact

- Sin cambios de API ni de datos: los formularios siguen recibiendo `YYYY-MM-DD`.
