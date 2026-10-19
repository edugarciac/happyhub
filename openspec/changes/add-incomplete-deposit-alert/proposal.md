## Why

El webhook marca la señal como pagada con cualquier importe que llegue de Stripe. Un cobro creado a mano o una prueba con un importe menor deja la reserva como "Señal pagada" sin que el admin sepa que falta dinero.

## What Changes

- Al registrar una señal por Stripe, si el importe cobrado es menor que `deposit_amount` de la reserva, se envía un email de aviso a los admins ("Señal incompleta: cobrados X € de Y €") con el importe que falta
- El pago se sigue registrando como hasta ahora (no se bloquea: puede haber acuerdos o descuentos)

## Capabilities

### Modified Capabilities

- `stripe-webhook`: aviso de señal incompleta

## Impact

- **Backend**: `src/pages/api/stripe-webhook.ts`, plantilla `incompleteDepositAlertEmail` en `src/lib/emailTemplates.ts`
