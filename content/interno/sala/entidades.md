---
type: detalle
title: Las entidades de Home Assistant
summary: El nombre interno de cada luz, aire, equipo de música, sensor y script de la sala.
parent: sala/home-assistant
order: 3
tags: [entidades, home assistant]
---

## ¿Qué es cada aparato?

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
| Proyector (Chromecast «Proyector») | `media_player.proyector` |
| Nombre del evento | `input_text.evento` |

## ¿Qué sensores y scripts usa el panel?

| Qué es | Entidad |
|---|---|
| Estado de la sala (plantilla) | `sensor.estado_sala` |
| Estado del sonido (plantilla) | `sensor.estado_sonido_sala` |
| Cómo está conectada la música (plantilla) | `sensor.conexion_musica_sala` |
| Estado del proyector (plantilla) | `sensor.estado_proyector` |
| Fondo elegido del proyector | `input_select.fondo_proyector` |
| Poner el fondo del proyector | `script.proyector_poner_fondo` |
| Fondo automático del proyector | `automation.proyector_fondo_cuando_no_se_proyecta_nada` |
| Sala ON | `script.encender_sala` |
| Música ON | `script.encender_musica` |
| Sala OFF | `script.cerrar_sala` |
| Conectar mi móvil | `script.modo_bluetooth` |

Los sensores del sonido están en `home-assistant/packages/sala_audio.yaml`; los del proyector, en `home-assistant/packages/sala_proyector.yaml`.
