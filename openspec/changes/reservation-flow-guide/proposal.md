## Why

El flujo de una reserva (estados, botones del admin y pasos automáticos de Stripe y del aviso diario) ha crecido y no está a la vista. Cada admin tiene que deducirlo de los botones.

## What Changes

- Botón «Cómo funciona» en la cabecera de la página de reservas, que abre un esquema con todos los estados (Pendiente → Aprobada → Señal pagada → Pagado → Evento Realizado, y Cancelada), qué botón o qué evento automático lleva de uno a otro, la fianza y los cobros adicionales.
- El esquema usa las mismas etiquetas, colores y plazos que el código (`reservationStatus`, `config/payments`), así no se desactualiza.
- Tailwind también escanea `src/utils`, donde están los colores de los estados (el de «Señal pagada» no se generaba).

## Impact

- Nuevo `src/components/admin/ReservationFlowGuide.tsx`
- `src/pages/admin/reservations/index.tsx`, `src/config/payments.ts` (`REMAINING_REMINDER_DAYS_BEFORE`), `src/lib/reservationFlow.ts`, `tailwind.config.js`
