## Why

El propietario necesita recibir un WhatsApp en su cuenta con cada nueva reserva. En producción no hay credenciales de WhatsApp Cloud API (`WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN`), y conseguirlas exige una app de Meta, un número de empresa, un token permanente y plantillas aprobadas: no da tiempo antes de la inauguración (16 oct 2026).

## What Changes

- `sendAdminNotification` (en `lib/whatsapp.ts`) usa **CallMeBot** si existe `CALLMEBOT_API_KEY`: WhatsApp gratuito al propio número del admin (`ADMIN_WHATSAPP_NUMBER`), sin cuenta de Meta.
- Sin `CALLMEBOT_API_KEY` se mantiene el envío por WhatsApp Cloud API (comportamiento actual).
- Afecta a todos los avisos al admin: solicitud de reserva, pago completado y feedback.

## Fuera de alcance

- WhatsApp a clientes (exige Meta Cloud API con plantillas aprobadas).

## Impact

- `src/lib/whatsapp.ts`, test nuevo `whatsappCallMeBot.test.ts`.
- Nueva variable `CALLMEBOT_API_KEY` (la obtiene el propietario activando CallMeBot desde su móvil).
