---
type: operacion
title: Instalar cambios en Home Assistant
parent: sala/home-assistant
order: 3
when: Cuando cambie algo en la carpeta home-assistant/ del repositorio
tags: [home assistant, instalar, yaml]
---

## Para qué sirve

Pasar a la tablet los cambios del panel, los scripts o los sensores que están en el repositorio.

## Cuándo usarla

Cuando se haya cambiado algo en `home-assistant/`. Mejor fuera del horario de eventos.

## Pasos

1. Haz una copia de seguridad: Ajustes > Sistema > Copias de seguridad.
2. Sigue el orden de `home-assistant/README.md`: primero sensores (y reinicia), después scripts, al final el dashboard.
3. Al crear un script nuevo, comprueba que su id es exactamente el del fichero (por ejemplo `script.encender_musica`).
4. Prueba en la tablet los pasos de «Probar» del README.

## Qué hace

Home Assistant usa la configuración nueva. La web no cambia: si también cambian textos de la guía, se publican al pasar la rama a `main`.

## Si algo falla

- **El panel sale en blanco o con errores**: restaura la copia de seguridad.
- **Sala ON enciende las luces pero no la música**: el id de `script.encender_musica` no coincide.
- **No sale el aviso «Encendiendo…»**: faltan los sensores; revisa en Herramientas de desarrollador > Estados que existe `sensor.estado_sala`.
