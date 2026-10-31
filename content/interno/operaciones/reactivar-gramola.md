---
type: operacion
title: Reactivar la Gramola
parent: sala/home-assistant
order: 4
when: Cuando estén listas las listas de canciones de la Gramola
tags: [gramola, música, panel]
---

## Para qué sirve

Volver a activar el botón Gramola del panel, que ahora sale en gris con «Próximamente».

## Cuándo usarla

Cuando las 4 listas (Música Española, Cumpleaños, Verbena, Remember) estén guardadas como presets 1 a 4 en el WiiM.

## Pasos

1. En `home-assistant/dashboard/panel-clientes.yaml`, busca el comentario «Gramola desactivada» y sigue sus instrucciones.
2. Recupera la guía pública `content/kb/operaciones/poner-gramola.md` del historial de git (`git log --all -- content/kb/operaciones/poner-gramola.md`) y enlázala desde el panel de control.
3. Actualiza [El panel de la tablet](../sala/panel-de-la-tablet.md).
4. [Instala el cambio en Home Assistant](instalar-cambios-home-assistant.md).

## Qué hace

El botón Gramola vuelve a abrir la vista con las 4 listas, y la guía de clientes explica cómo usarla.

## Si algo falla

- **Una lista no suena**: comprueba en la app WiiM Home que el preset tiene una lista asignada.
