## Context

HappyHub tiene una plataforma de eventos colaborativos ya construida (collaborative-event-core) pero sin presencia en el menú principal. Los visitantes anónimos no descubren esta funcionalidad. El área privada es el único punto de acceso actual.

## Goals

1. Dar visibilidad de primer nivel a los eventos colaborativos
2. Convertir `/mis-eventos` en un canal de captación de nuevos usuarios
3. Comunicar la propuesta de valor completa del producto antes del registro
4. Mantener el área privada como hub operativo (sin duplicar funcionalidad)

## Decisions

### D1: Landing pura vs. dashboard
Se eligió landing de marketing pura para `/mis-eventos`. El dashboard real vive en `/area-privada`. Razón: evitar duplicación de código y mantener un único punto de verdad para la gestión de eventos. El redirect automático para usuarios con sesión hace la experiencia transparente.

### D2: Visibilidad universal del ítem de menú
"Mis Eventos" aparece en el nav para todos los visitantes, incluidos anónimos. Razón: maximizar descubrimiento. Los visitantes anónimos aterrizan en la landing y se convierten en registros.

### D3: Imagen real de evento como hero
Se usa la imagen `Happyhub_eventos.png` generada específicamente para esta página, con la estética del local real (techo negro, suelo gris, ladrillo, logo). Transmite autenticidad frente a stock photography.

## Page Structure: `/mis-eventos`

### Para usuarios sin sesión (render normal)

```
[Hero]
  Imagen Happyhub_eventos.png a pantalla casi-completa con overlay oscuro
  Badge: "Nuevo · Eventos colaborativos"
  H1: "Organiza eventos increíbles. Juntos."
  Subtítulo: pitch de 2 líneas
  CTA primario: "Iniciar sesión para empezar" → /login?redirect=/area-privada
  CTA secundario: "¿No tienes cuenta? Crear una gratis" → /register

[Timeline de fases]
  3 columnas: Antes / Durante / Después
  Cada columna lista las funcionalidades clave de esa fase

[Grid de funcionalidades]
  8 cards con icono + título + descripción breve:
  - Gestión de invitados
  - Timeline de actividades
  - Coordinación de regalo
  - Recordatorios automáticos
  - Invitaciones digitales
  - Galería de fotos
  - Comentarios y valoraciones
  - Soporte WhatsApp

[Servicios adicionales]
  3 cards: Catering / Decoración / Animación
  Descripción: "Configura y reserva directamente desde el evento"

[CTA final]
  Fondo de color primario
  "¿Listo para organizar tu evento perfecto?"
  Botón: "Empezar ahora"
```

### Para usuarios con sesión activa (server-side)
`getServerSideProps` detecta sesión → `redirect: { destination: '/area-privada', permanent: false }`

## Risks

- **Promesas de funcionalidades no implementadas**: La landing describe features completas (fotos, regalo, etc.) que pueden estar parcialmente implementadas. Mitigación: usar lenguaje aspiracional ("podrás...") y marcar algunas como "Próximamente" si es necesario.
- **Desincronización nav**: Si en el futuro se crea una ruta dedicada para eventos (fuera de área privada), el redirect deberá actualizarse.
