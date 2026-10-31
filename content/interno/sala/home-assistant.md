---
type: hub
title: Home Assistant de la sala
summary: Qué controla la tablet de la sala, cómo funciona cada botón, los scripts y cómo cambiarlo.
order: 1
emoji: 🏠
tags: [home assistant, panel, tablet, sala]
---

## ¿Qué es y dónde está?

Home Assistant controla las luces, el aire y la música de la sala. La tablet muestra el dashboard **panel-clientes** en modo kiosco (los clientes no ven la barra lateral ni la cabecera) y se abre en la red local como `homeassistant.local`.

El botón **Ayuda** de la tablet abre la guía pública [/guia-sala/panel](/guia-sala/panel), que solo se puede mostrar dentro de `homeassistant.local`. Si la tablet abre Home Assistant con otra dirección, el botón Ayuda saldrá en blanco hasta añadirla en `next.config.js`.

## ¿Dónde está la configuración?

En la carpeta `home-assistant/` del repositorio (dashboard, scripts y sensores). **No se despliega sola**: hay que pegarla en Home Assistant. [Instalar cambios en Home Assistant](../operaciones/instalar-cambios-home-assistant.md)

## Explicaciones

- [El panel de la tablet](panel-de-la-tablet.md): qué ve el cliente y cuándo (Sala ON / Sala OFF, Música ON, Gramola, conexión).
- [Los scripts](scripts.md): qué hace cada botón por dentro.
- [Las entidades](entidades.md): el nombre de cada aparato en Home Assistant.

## Operaciones

- [Un cliente dice que no se oye la música](../operaciones/cliente-no-oye-musica.md)
- [Cambiar el nombre del evento en el panel](../operaciones/cambiar-nombre-evento.md)
- [Instalar cambios en Home Assistant](../operaciones/instalar-cambios-home-assistant.md)
- [Reactivar la Gramola](../operaciones/reactivar-gramola.md)
