## Context

Todas las fechas de apertura están centralizadas en `src/config/opening.ts` (`OPENING_DATE`, `BOOKINGS_FROM_DATE` y sus etiquetas), usadas por `OpeningCountdown`, `ComingSoonOverlay`, `FullCalendar` y `/api/webhook-reserva`.

## Goals / Non-Goals

**Goals:** mover la inauguración al 18/10 manteniendo la regla "se reserva desde el día siguiente".

**Non-Goals:** el descuento de inauguración (cambio `opening-discount`).

## Decisions

1. Solo se cambian las 4 constantes; no hay textos con la fecha escritos a mano.

## Risks / Trade-offs

- [Riesgo] Solicitudes existentes para el 17/18 de octubre → listarlas con SQL y reubicarlas.
