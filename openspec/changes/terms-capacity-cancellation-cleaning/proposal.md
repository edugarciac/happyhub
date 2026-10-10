## Why

El propietario corrige las condiciones del servicio:
- **Aforo máximo: 50 personas** (los textos decían 150).
- **Cancelación: con menos de 3 días se retiene el depósito** (los textos decían 15 días, y había hasta cuatro versiones distintas según la página).
- **El espacio debe quedar completamente recogido y en las mismas condiciones en que se entregó**, también en los términos resumidos.
- **El incumplimiento puede tener repercusiones económicas**, por ejemplo **50 €** por la limpieza posterior.

## What Changes

- Términos resumidos del paso 3 de la reserva: aforo 50, cancelación 3 días, espacio recogido y aviso de repercusiones económicas (50 € de limpieza).
- `/terminos`: política de cancelación (≥ 3 días: devolución total; < 3 días: se retiene el depósito), aforo de 50 personas y nuevo recuadro "Incumplimiento de las obligaciones" (50 € de limpieza, aparte de los daños del apartado 7).
- Contrato (admin) y PDF de condiciones: los mismos cambios.
- FAQs de `/como-funciona` y `/contacto`: misma política de cancelación, aforo de 50 y limpieza.
- Límite de invitados a 50 en los formularios de admin (crear/editar) y en la validación. El asistente de reserva ya limitaba a 50.

## Fuera de alcance

- La retención de la fianza "hasta 15 días naturales después del evento" en el contrato se refiere a la devolución de la fianza, no a la cancelación, y se mantiene.

## Impact

- Solo textos y límites de formulario. Sin cambios de BD ni de API.
