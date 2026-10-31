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
2. Si no pone «Sonido listo», que pulse **Música ON** y espere hasta un minuto.
3. Si pone «Sonido listo», que mire la tarjeta de conexión: debe decir «Móvil conectado». Si dice «Listo para conectar», que elija «HappyHub Música» en el Bluetooth del móvil.
4. Si está conectado, que suba el volumen en el panel y en el móvil.

## Qué hace

Recorre en orden las tres causas: equipo apagado, móvil no conectado, volumen bajo.

## Si algo falla

- **Música ON no llega a «Sonido listo»**: el WiiM no responde. Abre Home Assistant en remoto y mira `media_player.wiim_amp_happyhub`; si está `unavailable`, apaga y enciende el amplificador desde Home Assistant.
- **No aparece «HappyHub Música»**: que pulse **Conectar mi móvil** y espere 10 segundos.
