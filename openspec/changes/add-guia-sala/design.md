## Context

El panel de clientes es un dashboard de Home Assistant en una tablet Android en modo kiosko, servido por HTTP en la red local. La web es Next.js 14 (Pages Router) en Vercel con cabeceras de seguridad globales (`X-Frame-Options: SAMEORIGIN`), que hoy impedirían mostrar cualquier página dentro del panel.

## Decisions

### Una sola fuente de contenido
El texto vive en `src/data/` (TypeScript tipado). `/como-funciona` y `/guia-sala` leen del mismo módulo. Editar una respuesta actualiza la web y la tablet a la vez.

### Ruta dedicada para la tablet en vez de `?kiosk=1`
`/guia-sala/panel` se distingue por `pathname`, disponible desde el primer render. Con un parámetro de query, `router.query` llega vacío en el primer render de páginas estáticas y la cabecera parpadearía. Además permite acotar la excepción de framing a una sola ruta.

### Excepción de framing acotada
La regla global pasa a `source: '/((?!guia-sala/panel).*)'` y se añade una regla para `/guia-sala/panel` con la misma CSP más `frame-ancestors *` y sin `X-Frame-Options`. No se usa una lista de IPs porque la IP de Home Assistant puede cambiar y CSP no admite comodines en IPs.

### Búsqueda en cliente
Pocas decenas de preguntas: filtro en memoria normalizando a minúsculas y sin diacríticos (`NFD`), sobre pregunta y respuesta. Al buscar, los resultados se muestran desplegados.

## Risks

- Si el contenido de la guía cambia de forma relevante (p. ej. el nombre Bluetooth del amplificador), hay que actualizar `src/data/guiaSala.ts`.
- Cualquier sitio podría incrustar `/guia-sala/panel`; aceptable porque es información pública sin acciones.
