## Why

Decisión del propietario (17/10/2026): en la home, los tipos de evento "Boda" y "Comunión" se sustituyen por uno solo, "Baby Shower".

## What Changes

- Migración `029_baby_shower_event_type.sql`: crea "Baby Shower" (en la posición de Comunión) y desactiva "Boda" y "Comunión" (no se borran: puede haber referencias).
- Se aplica una única vez en tiempo de ejecución desde `/api/event-types` (las migraciones de este proyecto se ejecutan a mano en Neon).
- Textos: meta descripción/keywords de la home y objeto de los términos cambian "comuniones" por "baby showers"; las keywords de la home decían "eventos Madrid" y pasan a Esplugues de Llobregat.

## Impact

Datos de `event_types`, `src/pages/api/event-types.ts`, `src/pages/index.tsx`, `src/components/TermsContent.tsx`.
