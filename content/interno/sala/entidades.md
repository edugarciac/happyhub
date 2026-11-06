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
| Amplificador (no sale en el panel) | `switch.sala_principal_amplificador_audio` |
| Subwoofer (no sale en el panel) | `switch.sala_principal_subwoofer` |
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
| Cómo está conectada la música (plantilla; el panel ya no la usa) | `sensor.conexion_musica_sala` |
| Estado del proyector (plantilla) | `sensor.estado_proyector` |
| Fondo elegido del proyector | `input_select.fondo_proyector` |
| Poner el fondo del proyector | `script.proyector_poner_fondo` |
| Fondo automático del proyector | `automation.proyector_fondo_cuando_no_se_proyecta_nada` |
| Volumen inicial | `automation.wiim_volumen_inicial_al_encender` |
| Encender sala | `script.encender_sala` |
| Apagar sala | `script.cerrar_sala` |
| Encender música | `script.encender_musica` |
| Apagar música | `script.apagar_musica` |
| Liberar Bluetooth | `script.liberar_bluetooth` |
| Comandos directos al WiiM | `rest_command.wiim_linea`, `rest_command.wiim_bluetooth`, `rest_command.wiim_volumen` |

Los sensores son **Ayudantes de plantilla** creados desde la interfaz (Ajustes > Dispositivos y servicios > Ayudantes). Su plantilla está en `home-assistant/helpers/` del repositorio; los scripts en `home-assistant/scripts/` y la automatización en `home-assistant/automations/`.
