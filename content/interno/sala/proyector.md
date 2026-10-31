---
type: detalle
title: El proyector
summary: "Cómo se sabe si el proyector está encendido, cómo se usa y cómo funciona el fondo por defecto."
parent: sala/home-assistant
order: 4
tags: [proyector, chromecast, fondo, home assistant]
---

## ¿Cómo funciona el proyector?

1. Se enciende con el **mando a distancia** (no tiene control desde Home Assistant; a futuro, emisor IR).
2. El cliente envía contenido desde su móvil al Chromecast **«Proyector»** (botón Enviar / Cast).

Sala ON y Sala OFF **no** encienden ni apagan el proyector.

## ¿Cómo sabe el panel si está encendido?

Mirando el Chromecast `media_player.proyector`, con `sensor.estado_proyector`:

| Estado | Cuándo | Qué ve el cliente |
|---|---|---|
| `apagado` | El Chromecast no responde (`unavailable`) | «Proyector apagado · Enciéndelo con el mando» |
| `listo` | Responde y no hay contenido | «Proyector listo · Envía contenido desde tu móvil» |
| `fondo` | Muestra un fichero de `happyhub/proyector` | «Mostrando fondo HappyHub» |
| `proyectando` | Un cliente envía algo | «Proyectando · app y título» |

**Ojo**: «encendido» significa que el Chromecast responde. Si el Chromecast se alimenta del USB del proyector, se apaga con él y el estado es fiable. Si tiene su propio cargador, seguirá «listo» aunque el proyector esté apagado. Hasta tener emisor IR o un enchufe que mida consumo, no hay forma de saberlo con certeza.

## ¿Cómo funciona el fondo por defecto?

El cliente elige en el panel (**Fondo cuando no se proyecta nada**) una opción de `input_select.fondo_proyector`:

- **HappyHub imagen**: `/media/happyhub/proyector/happyhub.jpg`.
- **HappyHub vídeo**: `/media/happyhub/proyector/happyhub.mp4`. Al terminar se vuelve a poner (pausa de unos 10 s).
- **Fondo del Chromecast**: el modo ambiente de Google (fotos).

La automatización `proyector_fondo_auto` ejecuta `script.proyector_poner_fondo` cuando el proyector lleva 10 s `listo` o cuando el cliente cambia la opción. **Nunca actúa si está `proyectando`**, así que no corta a un cliente. El script ignora pulsaciones repetidas (`mode: single`).

Para cambiar las imágenes o el vídeo: [Cambiar los fondos del proyector](../operaciones/cambiar-fondos-proyector.md)

## ¿Por qué el Chromecast necesita la IP de Home Assistant?

El fondo se envía como una URL de Home Assistant. El Chromecast no entiende `homeassistant.local`, así que en Ajustes > Sistema > Red la URL local debe ser la IP (`http://192.168.x.x:8123`). Si no, el fondo no aparece.
