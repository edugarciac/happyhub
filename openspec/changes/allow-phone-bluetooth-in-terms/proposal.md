## Why

Los términos dicen que "el uso de dispositivos de audio externos no está permitido bajo ninguna circunstancia", pero el panel de la sala tiene el botón "Conectar mi móvil" y la guía invita a poner música desde el móvil por Bluetooth. Un cliente podría entender que conectar su móvil incumple el contrato que acepta al reservar.

## What Changes

- Términos (`TermsContent`): se prohíbe traer equipos de audio propios (altavoces, mesas de mezclas…) y se permite expresamente poner música desde el móvil por Bluetooth con el sistema de sonido de la sala.
- Contrato del admin (`/admin/reservations/[id]/contract`, cláusula 3.7): misma aclaración.
- `TERMS_LAST_UPDATED` pasa a "25 de octubre de 2026", para que la evidencia de aceptación distinga esta versión.

## Capabilities

### Modified Capabilities

- `booking-terms`: norma de equipos de audio

## Impact

- `src/components/TermsContent.tsx`, `src/pages/admin/reservations/[id]/contract.tsx`
