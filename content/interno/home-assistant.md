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

## ¿Qué hace el botón Activar? (`script.encender_sala`)

1. Enciende las luces Sala Principal, Barra y Jardín, y el amplificador de audio.
2. Enciende la luz Sala Kids (si falla, sigue).
3. A los 3 segundos, enciende el subwoofer.

No enciende el aire ni pone música. El amplificador y el subwoofer no tienen botón en el panel: si un cliente dice que no suena nada, casi siempre es que no ha pulsado **Activar**.

## ¿Qué hace el botón Desactivar? (`script.cerrar_sala`)

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

## ¿Cómo cambio el nombre del evento que sale en el panel?

Edita la entidad `input_text.evento` en Home Assistant. Si está vacía, el panel muestra «Celebra momentos inolvidables».

## Si cambio un script o el panel, ¿qué más tengo que cambiar?

Las guías para clientes explican qué hace cada botón. Si cambias lo que hace un script, actualiza también la guía: [Actualizar la guía de la sala](operaciones/actualizar-guia.md).
