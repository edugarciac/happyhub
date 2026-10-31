---
type: detalle
title: Los scripts de la sala
summary: Qué hace por dentro cada botón del panel (Sala ON, Música ON, Sala OFF, Conectar mi móvil).
parent: sala/home-assistant
order: 2
tags: [scripts, home assistant]
---

## ¿Qué hace Sala ON? (`script.encender_sala`)

1. Enciende las luces Sala Principal, Barra y Jardín.
2. Enciende la luz Sala Kids (si falla, sigue).
3. Ejecuta `script.encender_musica` y espera a que termine. Mientras, el panel muestra el aviso de arranque.

No enciende el aire ni pone música.

## ¿Qué hace Música ON? (`script.encender_musica`)

1. Enciende el amplificador.
2. A los 3 segundos, enciende el subwoofer.
3. Espera a que el WiiM esté disponible (máx. 60 s) y 2 s más.

## ¿Qué hace Sala OFF? (`script.cerrar_sala`)

1. Pausa la música.
2. Apaga el subwoofer y, a los 3 segundos, el amplificador y las luces Sala Principal, Barra y Jardín.
3. Apaga la luz Sala Kids y los dos aires acondicionados (si alguno falla, sigue sin avisar).

Pide confirmación antes de ejecutarse.

## ¿Qué hace Conectar mi móvil? (`script.modo_bluetooth`)

Cambia el amplificador a *Line In* para soltar el móvil que estuviera conectado, espera 8 segundos y vuelve a *Bluetooth* para emparejar uno nuevo («HappyHub Música»). Si se pulsa mientras está en marcha, no hace nada.

## Si cambio un script, ¿qué más tengo que cambiar?

1. El YAML en `home-assistant/scripts/` del repositorio.
2. Esta página.
3. La guía pública que explica ese botón. [Actualizar la guía de la sala](../operaciones/actualizar-guia.md)
