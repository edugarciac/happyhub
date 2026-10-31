---
type: operacion
title: Cambiar los fondos del proyector
parent: sala/home-assistant
order: 5
when: Para cambiar la imagen o el vídeo de HappyHub que sale en el proyector
tags: [proyector, fondo, imagen, vídeo]
---

## Para qué sirve

Cambiar la imagen o el vídeo que se ve en el proyector cuando nadie está proyectando.

## Cuándo usarla

Cuando haya un logo, una imagen de temporada o un vídeo nuevo de HappyHub.

## Pasos

1. Prepara el fichero: imagen **JPG** horizontal (1920×1080) o vídeo **MP4** (H.264, 1080p, mejor de menos de 1 minuto y sin sonido).
2. En Home Assistant, abre **Multimedia** > **Mis multimedia** > `happyhub` > `proyector`.
3. Sube el fichero con el mismo nombre que el actual (`happyhub.jpg` o `happyhub.mp4`) para sustituirlo.
4. En el panel, elige otra opción de fondo y vuelve a la tuya para que se recargue.

## Qué hace

La próxima vez que el proyector quede libre, muestra el fichero nuevo.

## Si algo falla

- **No sale el fondo**: comprueba que la URL local de Home Assistant usa la IP. [El proyector](../sala/proyector.md)
- **Quiero añadir una opción más**: añade la opción en `input_select.fondo_proyector` y su rama en `script.proyector_poner_fondo` (`home-assistant/packages/sala_proyector.yaml`), y una tarjeta más en el dashboard. Actualiza también las dos guías.
