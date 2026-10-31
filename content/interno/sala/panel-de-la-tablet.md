---
type: detalle
title: El panel de la tablet
summary: Qué ve el cliente en cada estado de la sala y del sonido, y por qué.
parent: sala/home-assistant
order: 1
tags: [panel, botones, sala on, música on, gramola]
---

## ¿Cómo funciona el botón Sala ON / Sala OFF?

Depende de `sensor.estado_sala`:

| Estado | Qué ve el cliente |
|---|---|
| `off` (luces, amplificador y subwoofer apagados) | **Sala ON** |
| `arrancando` (`script.encender_sala` en marcha) | «Encendiendo sala… El sonido tardará unos segundos» (parpadea, no se puede pulsar) |
| `on` (luz Sala Principal, amplificador y subwoofer encendidos) | **Sala OFF** |
| `parcial` (cualquier mezcla) | **Sala ON** y **Sala OFF** |

Si el sensor no existe (falta el package), salen los dos botones, como antes.

## ¿Cómo funciona Música ON?

Está arriba del grupo **Música**. Depende de `sensor.estado_sonido_sala`:

| Estado | Qué ve el cliente |
|---|---|
| `apagado` / `incompleto` | **Música ON** |
| `arrancando` (`encender_sala` o `encender_musica` en marcha) | «Encendiendo música…» (no se puede pulsar) |
| `listo` (amplificador y subwoofer encendidos y WiiM disponible) | «Sonido listo» (sin acción) |

Debajo se ven **Amplificador** y **Subwoofer** en verde cuando están encendidos. No se pueden tocar: el cliente no puede apagarlos sueltos.

## ¿Por qué no se puede pulsar muchas veces seguidas?

Dos capas: el botón se oculta mientras arranca y, además, los scripts tienen `mode: single` + `max_exceeded: silent`, así que una segunda pulsación se ignora sin error.

## ¿Qué muestra la tarjeta de conexión del grupo Música?

Para Bluetooth: «Listo para conectar» o «Móvil conectado» (la guía pública usa esos textos). Para el resto, `sensor.conexion_musica_sala` traduce el atributo `source` del WiiM: Móvil por Bluetooth, Gramola (WiFi), Spotify Connect, AirPlay o Cable. También muestra app, canción, artista, estado y volumen.

El nombre del móvil conectado no lo da la integración del WiiM, así que no sale.

## ¿Por qué la Gramola sale en gris?

Está desactivada hasta tener las listas de canciones: dice «Próximamente» y no hace nada. [Reactivar la Gramola](../operaciones/reactivar-gramola.md)

## ¿Qué muestra el grupo Proyector?

El estado del proyector (apagado, listo, fondo HappyHub o proyectando) y tres tarjetas para elegir el fondo cuando no se proyecta nada; la elegida sale resaltada en rosa. Todo se explica en [El proyector](proyector.md).
