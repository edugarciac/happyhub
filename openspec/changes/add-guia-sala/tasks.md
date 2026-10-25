## 1. Datos

- [x] 1.1 Mover las categorías de `/como-funciona` a `src/data/faqs.ts`
- [x] 1.2 Crear `src/data/guiaSala.ts` con panel, luces, aire, música, gramola y ayuda

## 2. Páginas

- [x] 2.1 Componente `GuiaSala` con buscador sin acentos, chips de categoría y acordeón
- [x] 2.2 `/guia-sala` (con cabecera) y `/guia-sala/panel` (sin cabecera, pie, widget ni banner de cookies)
- [x] 2.3 Enlace a la guía desde `/como-funciona`

## 3. Cabeceras

- [x] 3.1 Excluir `/guia-sala/panel` de la regla global y servirlo con `frame-ancestors *` sin `X-Frame-Options`

## 4. Verificación

- [x] 4.1 `npm run type-check`, `npm test`, `npm run build`
- [ ] 4.2 En preview: buscar "musica", filtrar por categoría, comprobar cabeceras de `/guia-sala/panel` y de `/`
- [ ] 4.3 En producción: incrustar `/guia-sala/panel` en la subvista "Ayuda" del panel de Home Assistant
