---
type: detalle
title: Los scripts de la sala
summary: Qué hace por dentro cada botón del panel (Encender sala, Apagar sala, Encender música, Apagar música, Liberar Bluetooth) y el fondo del proyector.
parent: sala/home-assistant
order: 2
tags: [scripts, home assistant]
---

## ¿Qué hace Encender sala? (`script.encender_sala`)

1. Enciende las luces Sala Principal, Barra y Jardín.
2. Enciende la luz Sala Kids (si falla, sigue).
3. Ejecuta `script.encender_musica` y espera a que termine. Mientras, el panel muestra el aviso de arranque.

No enciende el aire ni pone música.

## ¿Qué hace Encender música? (`script.encender_musica`)

1. Enciende el amplificador.
2. A los 3 segundos, enciende el subwoofer.

No espera al WiiM. La automatización `wiim_volumen_inicial` pone el volumen al 25 % al encender el amplificador y reintenta cada 10 s durante 5 minutos.

## ¿Qué hace Apagar música? (`script.apagar_musica`)

Pausa la música, apaga el subwoofer y, a los 3 segundos, el amplificador. Pide confirmación antes de ejecutarse.

## ¿Qué hace Apagar sala? (`script.cerrar_sala`)

1. Pausa la música.
2. Apaga el subwoofer y, a los 3 segundos, el amplificador y las luces Sala Principal, Barra y Jardín.
3. Apaga la luz Sala Kids y los dos aires acondicionados (si alguno falla, sigue sin avisar).

Pide confirmación antes de ejecutarse.

## ¿Qué hace Liberar Bluetooth? (`script.liberar_bluetooth`)

Cambia el WiiM a línea para soltar el móvil que estuviera conectado, espera 8 segundos y vuelve a Bluetooth para conectar uno nuevo («HappyHub Música»). Si se pulsa mientras está en marcha, no hace nada.

Habla directamente con el WiiM por `rest_command` porque `dlna_dmr` no permite cambiar de entrada. Necesita que el WiiM conserve su IP: resérvala en el router.

## ¿Qué hace el fondo del proyector? (`script.proyector_poner_fondo`)

Si el proyector está libre o mostrando el fondo, pone la imagen o el vídeo de HappyHub según la opción elegida, o para el fondo si se eligió «Fondo del Chromecast». Si un cliente está proyectando, no hace nada. Lo lanza la automatización del proyector. [El proyector](proyector.md)

## Si cambio un script, ¿qué más tengo que cambiar?

1. El YAML en `home-assistant/scripts/` del repositorio.
2. Esta página.
3. La guía pública que explica ese botón. [Actualizar la guía de la sala](../operaciones/actualizar-guia.md)
