---
type: operacion
title: Un cliente dice que no se oye la música
parent: sala/home-assistant
order: 1
when: Cuando un cliente llama o escribe porque no suena nada
tags: [música, soporte, cliente]
---

## Para qué sirve

Resolver por teléfono o WhatsApp el problema más habitual de la sala.

## Cuándo usarla

Cuando un cliente avisa de que no suena la música.

## Pasos

1. Pregúntale qué pone arriba del grupo **Música** en el panel.
2. Si no pone «Música encendida», que pulse **Encender música** y espere hasta un minuto.
3. Si pone «Música encendida», que compruebe en el móvil que está conectado a «HappyHub Música». El panel no indica qué móvil está conectado.
4. Si está conectado, que suba el volumen en el panel y en el móvil.

## Qué hace

Recorre en orden las tres causas: equipo apagado, móvil no conectado, volumen bajo.

## Si algo falla

- **Sale «Sonido incompleto»**: que pulse **Encender música** otra vez. Si sigue igual, mira en Home Assistant los interruptores del amplificador y el subwoofer.
- **No aparece «HappyHub Música»**: que espere un minuto desde el encendido, pulse **Liberar Bluetooth** y espere 10 segundos. `media_player.wiim_amp_happyhub` puede seguir `unavailable` varios minutos aunque el WiiM ya funcione, así que no sirve para saber si está encendido.
