## Context

Tres problemas independientes agrupados en un solo change por ser pequeños y de bajo riesgo:

1. `Footer.tsx` usa `scrollToSection(id)` con `document.getElementById` para "Inicio" (`hero`), "Características" (`features`) y "Servicios" (`services`). De esos tres ids, solo `features` existe realmente en `src/pages/index.tsx`. Además, `scrollToSection` solo funciona si el usuario ya está en la home — desde cualquier otra página no hace nada (el elemento no existe en el DOM actual).
2. `como-funciona.tsx` renderiza la respuesta de cada FAQ con `{isOpen && (<div>...)}` — el nodo no existe en el DOM hasta que se hace click. Confirmado en navegador real (Chrome) que el toggle funciona correctamente tras hidratación; el problema es solo de contenido inicial en el HTML servido/estático.
3. `index.tsx` usa `fetchInstagramPosts()` (`src/lib/instagram.ts`), que devuelve `[]` si `INSTAGRAM_ACCESS_TOKEN` no está seteado (no lo está en `.env.local`). El fallback actual usa la palabra "Proximamente", que da sensación de sitio incompleto.

## Goals / Non-Goals

**Goals:**
- Todos los enlaces del footer navegan a un destino real y funcional desde cualquier página del sitio
- El contenido de las respuestas FAQ está presente en el DOM inicial (mejor SEO/accesibilidad), sin cambiar el comportamiento visual para el usuario
- El fallback de Instagram no suena a "en construcción"

**Non-Goals:**
- No se implementa el token de Instagram ni se activa el feed real
- No se añaden partners ficticios
- No se toca el multi-idioma

## Decisions

1. **Footer**: reemplazar los `<button onClick={scrollToSection}>` por `<Link>` de Next.js apuntando a rutas reales. "Características" usa `/#features` (Next.js navega y el navegador hace scroll nativo al id si la ruta ya está cargada o tras la navegación). Se elimina `scrollToSection` y su import implícito de DOM APIs.
2. **FAQ**: en vez de `{isOpen && <div>...</div>}`, renderizar siempre el `<div>` y controlar visibilidad con `className={isOpen ? 'block ...' : 'hidden'}` (o `grid-rows` si se quiere mantener la transición). Se mantiene `aria-expanded` en el botón. No se usa `<details>/<summary>` nativo para no rehacer el estilo actual del botón/chevron.
3. **Instagram fallback**: nuevo copy: "Muy pronto compartiremos aquí nuestros mejores momentos. Síguenos en Instagram para no perderte nada." — reutiliza el botón `@happyhub.es` ya existente debajo como CTA, sin necesidad de más cambios.

## Risks / Trade-offs

- [Riesgo] Cambiar `{isOpen && ...}` a clases puede afectar la transición de altura si en el futuro se anima — hoy no hay animación de altura (aparece/desaparece sin transición), así que el cambio es visualmente idéntico.
- [Riesgo] "Política de cancelación" y "Preguntas frecuentes" apuntando al mismo destino (`/como-funciona`) puede parecer redundante en el footer → Aceptado como mejor alternativa a un 404; no se crea una página dedicada porque el contenido legal completo de cancelación no existe hoy fuera del FAQ.
