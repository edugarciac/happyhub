---
type: operacion
title: Actualizar la guía de la sala
order: 1
when: Cuando cambie una norma, un botón del panel o una respuesta de la FAQ
tags: [guía, web, faq]
---

## Para qué sirve

Cambiar lo que leen los clientes en la guía de la sala (`/guia-sala`, y el botón **Ayuda** de la tablet) y en las preguntas frecuentes (`/como-funciona`).

## Cuándo usarla

Cuando cambie una norma, lo que hace un botón del panel, o cuando un cliente pregunte algo que debería estar explicado.

## Pasos

1. Abre el repositorio `happyhub` en GitHub y entra en la carpeta `content/kb/`.
2. Abre el fichero del tema (por ejemplo `normas.md` o `operaciones/encender-sala.md`) y pulsa el lápiz para editar.
3. Cambia el texto. Cada pregunta empieza por `## `. En las operaciones no borres ninguna de las secciones fijas.
4. Guarda con **Commit changes** en la rama `main`.
5. Espera unos minutos a que Vercel publique la web y revisa la página.
6. Actualiza también el manual interno (`content/interno/`) si el cambio afecta a cómo funciona algo por dentro (scripts, entidades, panel). **Las dos guías siempre van juntas**: un cambio en una sin la otra se considera incompleto.

Las reglas del formato están en `content/kb/README.md`.

## Qué hace

Vercel vuelve a generar la web con el texto nuevo. La misma pregunta se actualiza en todos los sitios donde aparece (FAQ, guía y tablet), porque solo está escrita una vez.

## Si algo falla

- **La web no se actualiza**: en Vercel, mira si el último despliegue ha fallado. Si el error empieza por `KB`, dice el fichero y el problema: un enlace a un documento que no existe, o una operación a la que le falta una sección.
- **Prefieres no tocar GitHub**: pide el cambio a Edu o a Claude.
