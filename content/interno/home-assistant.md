---
type: detalle
title: Home Assistant de la sala
order: 1
emoji: 🏠
tags: [home assistant, panel, scripts, tablet]
---

## ¿Qué es y dónde está?

Home Assistant controla las luces, el aire y la música de la sala. La tablet de la sala muestra el dashboard **panel-clientes** en modo kiosco (sin barra lateral ni cabecera para los clientes) y se abre en la red local como `homeassistant.local`.

La guía para clientes del botón **Ayuda** es la página [/guia-sala/panel](/guia-sala/panel) de la web, que solo se puede mostrar dentro de `homeassistant.local`. Si algún día la tablet abre Home Assistant con otra dirección, el botón Ayuda saldrá en blanco hasta añadir esa dirección en `next.config.js`.

## ¿Dónde está el YAML del panel?

En la carpeta `home-assistant/` del repo (ver su `README.md`). No se despliega solo: hay que pegarlo en Home Assistant.

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

Está arriba del grupo **Música** (y en la Gramola). Depende de `sensor.estado_sonido_sala`:

| Estado | Qué ve el cliente |
|---|---|
| `apagado` / `incompleto` | **Música ON** |
| `arrancando` (`encender_sala` o `encender_musica` en marcha) | «Encendiendo música…» (no se puede pulsar) |
| `listo` (amplificador y subwoofer ON y WiiM disponible) | «Sonido listo» (sin acción) |

**No se puede pulsar muchas veces seguidas**: el botón se oculta mientras arranca y, además, los scripts tienen `mode: single` + `max_exceeded: silent`, así que una segunda pulsación se ignora sin error.

## ¿Qué hace Música ON? (`script.encender_musica`)

1. Enciende el amplificador.
2. A los 3 segundos, enciende el subwoofer.
3. Espera a que el WiiM esté disponible (máx. 60 s) y 2 s más.

## ¿Qué hace Sala ON? (`script.encender_sala`)

1. Enciende las luces Sala Principal, Barra y Jardín.
2. Enciende la luz Sala Kids (si falla, sigue).
3. Ejecuta `script.encender_musica` y espera a que termine. Mientras, el panel muestra el aviso de arranque.

No enciende el aire ni pone música. El amplificador y el subwoofer se ven arriba del grupo **Música** pero no se pueden apagar sueltos: si un cliente dice que no suena nada, mira si pone «Sonido listo» o pídele que pulse **Música ON**.

## ¿Qué muestra la tarjeta de conexión del grupo Música?

Mantiene «Listo para conectar» y «Móvil conectado» para Bluetooth. Para el resto, `sensor.conexion_musica_sala` traduce el atributo `source` del WiiM: Móvil por Bluetooth, Gramola (WiFi), Spotify Connect, AirPlay o Cable. Además muestra app, canción, artista, estado y volumen. El nombre del móvil Bluetooth no lo da la integración del WiiM, así que normalmente no sale.

## ¿Qué hace Sala OFF? (`script.cerrar_sala`)

1. Pausa la música.
2. Apaga el subwoofer y, a los 3 segundos, el amplificador y las luces Sala Principal, Barra y Jardín.
3. Apaga la luz Sala Kids y los dos aires acondicionados (si alguno falla, sigue sin avisar).

Pide confirmación antes de ejecutarse.

## ¿Qué hace Conectar mi móvil? (`script.modo_bluetooth`)

Cambia el amplificador a *Line In* para soltar el móvil que estuviera conectado, espera 8 segundos y vuelve a *Bluetooth* para emparejar uno nuevo («HappyHub Música»). Si se pulsa mientras está en marcha, no hace nada.

## ¿Qué es cada aparato en Home Assistant?

| En el panel | Entidad |
|---|---|
| Luz Sala Principal | `switch.sala_1_luz_sala_principal` |
| Luz Sala Kids | `switch.sala_2_luz_sala_2` |
| Luz Barra | `switch.sala_principal_luz_barra` |
| Luz Jardín | `switch.shellyplugmg3_08927256e768` |
| Amplificador | `switch.sala_principal_amplificador_audio` |
| Subwoofer | `switch.sala_principal_subwoofer` |
| Aire Sala Principal | `climate.aidoo_pro` |
| Aire Sala Kids | `climate.aidoo_pro_2` |
| Música (WiiM) | `media_player.wiim_amp_happyhub` |
| Nombre del evento en el panel | `input_text.evento` |
| Estado de la sala (plantilla) | `sensor.estado_sala` |
| Estado del sonido (plantilla) | `sensor.estado_sonido_sala` |
| Script Música ON | `script.encender_musica` |
| Cómo está conectada la música (plantilla) | `sensor.conexion_musica_sala` |

## ¿Cómo cambio el nombre del evento que sale en el panel?

Edita la entidad `input_text.evento` en Home Assistant. Si está vacía, el panel muestra «Celebra momentos inolvidables».

## Si cambio un script o el panel, ¿qué más tengo que cambiar?

Las guías para clientes explican qué hace cada botón. Si cambias lo que hace un script, actualiza también la guía: [Actualizar la guía de la sala](operaciones/actualizar-guia.md).
