---
type: detalle
title: El panel de la tablet
summary: Qué ve el cliente en cada estado de la sala y del sonido, y por qué.
parent: sala/home-assistant
order: 1
tags: [panel, botones, encender sala, encender música, gramola]
---

## ¿Cómo se distinguen los botones de la información?

Nunca comparten aspecto:

- **Información**: sin caja, con un punto de color y texto blanco con sombra. No reacciona al toque.
- **Botón**: bloque relleno o con borde, con icono y un texto que empieza por verbo.
- **Botón que además tiene estado** (luces, fondos del proyector): bloque con borde cuyo relleno indica si está activo.

Al añadir una tarjeta, respeta esta regla.

## ¿Cómo funciona Encender sala / Apagar sala?

Depende de `sensor.estado_sala`:

| Estado | Qué ve el cliente |
|---|---|
| `off` (luces, amplificador y subwoofer apagados) | **Encender sala** |
| `arrancando` (`script.encender_sala` en marcha) | «Encendiendo sala…» (información) |
| `on` (luz Sala Principal, amplificador y subwoofer encendidos) | **Apagar sala** |
| `parcial` (cualquier mezcla) | **Encender sala** y **Apagar sala** |

Si el sensor no existe, salen los dos botones.

## ¿Cómo funciona el grupo Música?

Depende de `sensor.estado_sonido_sala`, que solo mira el amplificador, el subwoofer y si los scripts de encendido están en marcha:

| Estado | Información | Botones |
|---|---|---|
| `apagado` | Equipo de música apagado | **Encender música** |
| `arrancando` | Encendiendo música… | Ninguno |
| `listo` | Música encendida | **Apagar música** y **Liberar Bluetooth** |
| `incompleto` | Sonido incompleto | **Encender música** y **Apagar música** |

`listo` no significa que el WiiM ya responda: tarda alrededor de un minuto más. Por eso el texto avisa de que puede tardar.

El amplificador y el subwoofer no salen en el panel: el cliente solo enciende o apaga la música.

## ¿Por qué no se puede pulsar muchas veces seguidas?

Dos capas: el botón se oculta mientras arranca y, además, los scripts tienen `mode: single` + `max_exceeded: silent`, así que una segunda pulsación se ignora sin error.

## ¿Por qué el panel no dice qué móvil está conectado?

El WiiM está integrado con `dlna_dmr`, que no da el origen de la música y detecta el WiiM con varios minutos de retraso. Por eso el panel no usa `sensor.conexion_musica_sala` y no muestra el móvil conectado.

## ¿Dónde está la Gramola?

No aparece en la pantalla principal hasta tener las listas de canciones. [Reactivar la Gramola](../operaciones/reactivar-gramola.md)

## ¿Qué muestra el grupo Proyector?

El estado del proyector (apagado, listo, fondo HappyHub o proyectando) y tres botones para elegir el fondo cuando no se proyecta nada; el elegido sale relleno en rosa. Todo se explica en [El proyector](proyector.md).
