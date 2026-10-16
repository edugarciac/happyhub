## Why

La casilla "He leído y acepto" del paso 3 solo vive en el navegador: el servidor no recibe la aceptación ni guarda prueba. Ante una disputa (cancelación, daños, fianza) HappyHub no puede demostrar qué términos aceptó el cliente, cuándo ni desde dónde. La LSSI (arts. 23-28) admite la contratación electrónica, pero la carga de la prueba es del prestador.

Además: el contrato dice "acceso 1 hora antes" (la regla real es 30 minutos, con 1 hora extra contratable por 30 €) y aún incluye una franja de noche que no se ofrece.

## What Changes

- Nueva tabla `contract_acceptances`, inmutable (trigger que impide borrar o modificar la prueba), con: identidad declarada (nombre, email, teléfono), texto íntegro de los términos mostrados y su SHA-256, versión de términos, commit desplegado, resumen del contrato (fecha, franja, invitados, extras, precios, señal, método de pago), método de aceptación y si leyó hasta el final, fecha y hora del servidor, IP, user-agent, idioma del navegador, hash del conjunto de la prueba y fecha de envío del email de confirmación.
- `/api/webhook-reserva` exige `acceptTerms === true` y el texto de los términos; sin prueba guardada no hay reserva (si falla el guardado, se elimina la reserva y se pide reintentar).
- El email de solicitud confirma la aceptación (versión, fecha, enlace a los términos) — art. 28 LSSI.
- El contrato del panel muestra un bloque "Aceptación electrónica" con la prueba y usa nombre/email/teléfono de la aceptación cuando el cliente no tiene cuenta.
- Política de privacidad: se informa del registro de la prueba (IP, navegador) y de su conservación.
- Acceso anticipado: 30 minutos incluidos; 1 hora adicional por 30 € (contrato, FAQ, términos, PDF, tabla de precios). Se añade la migración para el extra en el catálogo.
- Contrato: se elimina la franja de noche; la tarde solo se amplía (hasta las 23:00) por acuerdo expreso.

## Capabilities

### New Capabilities
- `contract-acceptance`: registro inmutable de la aceptación electrónica de los términos.

### Modified Capabilities
- `booking-terms`: acceso anticipado y franjas en el contrato.

## Impact

- BD: tabla nueva creada de forma idempotente en tiempo de ejecución (patrón `ensure*` existente) + migración `026_contract_acceptances.sql`; migración `027_early_access_extra.sql` (manual, opcional).
- API: `webhook-reserva.ts`, `admin/reservations/[id]/index.ts`.
- Frontend: `Step3CustomerData.tsx`, contrato, FAQ, términos, PDF, tabla de precios, privacidad.
