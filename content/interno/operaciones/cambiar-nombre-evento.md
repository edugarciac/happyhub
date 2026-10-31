---
type: operacion
title: Cambiar el nombre del evento en el panel
parent: sala/home-assistant
order: 2
when: Antes de cada evento, si se quiere personalizar el panel
tags: [panel, evento, nombre]
---

## Para qué sirve

Que el panel de la tablet muestre el nombre del evento (por ejemplo «Cumpleaños de Lucía»).

## Cuándo usarla

Antes de que lleguen los clientes.

## Pasos

1. En Home Assistant, abre Ajustes > Dispositivos y servicios > Entidades.
2. Busca `input_text.evento` y escribe el nombre.
3. Después del evento, déjalo vacío.

## Qué hace

El panel muestra el texto arriba. Si está vacío, muestra «Celebra momentos inolvidables».

## Si algo falla

- **No cambia en la tablet**: recarga la página en la tablet.
