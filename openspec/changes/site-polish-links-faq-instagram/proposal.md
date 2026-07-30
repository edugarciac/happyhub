## Why

Auditoría de QA de la web pública detectó varios problemas de pulido que restan profesionalidad y navegabilidad:

1. El footer tiene enlaces de navegación rota: "Servicios" e "Inicio" hacen scroll a anchors (`#services`, `#hero`) que no existen en el DOM, y "Preguntas frecuentes" / "Política de cancelación" apuntan a páginas (`/faq`, `/politica-cancelacion`) que nunca se crearon (404).
2. El acordeón de FAQ en `/como-funciona` no muestra la respuesta cuando se inspecciona el HTML sin ejecutar JS (fetch/lector), porque el contenido se desmonta del DOM cuando está cerrado. Funciona bien en navegador real (verificado), pero esto es malo para SEO/accesibilidad y generó una alarma de "bug" al auditar.
3. El mensaje de fallback del feed de Instagram en la home ("Proximamente: nuestro feed de Instagram") suena a "obra en construcción", lo cual resta profesionalidad en un sitio ya en producción — aunque el feed real no está disponible porque no hay `INSTAGRAM_ACCESS_TOKEN` configurado (fuera de alcance de este cambio, requiere credenciales del negocio).

## What Changes

- **Footer** (`src/components/Footer.tsx`): sustituir los botones `scrollToSection` rotos por enlaces reales:
  - "Inicio" → `/`
  - "Características" → `/#features` (ancla real que sí existe en `index.tsx`)
  - "Servicios" → `/servicios` (página real, consistente con el Header)
  - "Preguntas frecuentes" → `/como-funciona` (página real que contiene el FAQ)
  - "Política de cancelación" → `/como-funciona` (contiene la respuesta de cancelación; no existe página dedicada)
  - Eliminar la función `scrollToSection` ya que queda sin uso
- **FAQ** (`src/pages/como-funciona.tsx`): mantener el contenido de la respuesta siempre presente en el DOM, alternando visibilidad con clases CSS en vez de montar/desmontar condicionalmente. Sin cambio de comportamiento visual para el usuario.
- **Instagram fallback** (`src/pages/index.tsx`): cambiar el copy de "Proximamente: nuestro feed de Instagram" a un mensaje que invite a seguir la cuenta en vez de sonar a sección incompleta.

## Out of Scope

- Conseguir y configurar `INSTAGRAM_ACCESS_TOKEN` (requiere credenciales de negocio del usuario)
- Añadir más partners reales (contenido/negocio, no código) — solo hay 2 partners activos en BD
- Multi-idioma (catalán) — feature grande que requiere decisión de alcance/arquitectura, se trata en propuesta separada

## Capabilities

### Modified Capabilities

- `site-polish`: enlaces de navegación del footer y accesibilidad del contenido FAQ

## Impact

- **Frontend**: `src/components/Footer.tsx`, `src/pages/como-funciona.tsx`, `src/pages/index.tsx`
- No hay cambios de backend, DB ni APIs
