# Spec: Página /mis-eventos

## Route

`/mis-eventos` — Next.js Pages Router, archivo `src/pages/mis-eventos.tsx`

## Auth behavior

```typescript
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session) {
    return { redirect: { destination: '/area-privada', permanent: false } };
  }
  return { props: {} };
};
```

## Layout

Usa `<Header />` y `<Footer />` igual que el resto de páginas públicas. Sin `AdminLayout`.

## Secciones (en orden)

### 1. Hero

- **Imagen**: `Next/Image` con `src="/images/Happyhub_eventos.png"`, `fill`, `object-cover`, `priority`
- **Overlay**: `div` con `bg-black/50` sobre la imagen
- **Contenido sobre overlay** (centrado vertical y horizontal):
  - Badge pill: `"✨ Nuevo · Eventos colaborativos"` — fondo accent/primary con texto blanco
  - H1: `"Organiza eventos increíbles. Juntos."` — texto blanco, tamaño xl a 5xl responsive
  - Subtítulo: `"Crea tu evento, invita a tu grupo y gestiona todo desde un solo lugar: invitados, actividades, regalo, fotos y mucho más."` — texto white/80
  - CTA primario: botón blanco con texto primary → `/login?redirect=/area-privada`
  - CTA secundario: enlace texto blanco/70 → `/register`
- **Altura**: `min-h-[80vh]` o `h-screen` con cap

### 2. Timeline de fases

- **Fondo**: `bg-gray-50`
- **Título de sección**: `"De la idea al recuerdo"`
- **Layout**: 3 columnas en desktop, stack en móvil
- **Columnas**:

  | Antes | Durante | Después |
  |---|---|---|
  | Invitaciones digitales | Timeline del día | Galería de fotos |
  | Confirmación de asistencia | Actividades programadas | Comentarios de invitados |
  | Coordinación de regalo | Gestión en tiempo real | Valoraciones |
  | Recordatorios automáticos | Soporte WhatsApp | Recuerdos compartidos |

- Cada columna: icono grande + título de fase + lista de items con check icon

### 3. Grid de funcionalidades

- **Fondo**: `bg-white`
- **Título**: `"Todo lo que necesitas en un solo lugar"`
- **Grid**: 2 cols en móvil, 4 cols en desktop
- **8 cards**, cada una con: icono Lucide + título + descripción breve (1 línea)

  | Icono | Título | Descripción |
  |---|---|---|
  | `Users` | Gestión de invitados | Lista, RSVP y estado de confirmación |
  | `CalendarDays` | Timeline de actividades | Guion del evento minuto a minuto |
  | `Gift` | Coordinación de regalo | Decidid y repartid el regalo en grupo |
  | `Bell` | Recordatorios automáticos | Nadie se olvidará de nada |
  | `Mail` | Invitaciones digitales | Comparte con un solo enlace |
  | `Image` | Galería de fotos | Todas las fotos del evento en un álbum |
  | `MessageCircle` | Comentarios | El grupo opina y recuerda |
  | `MessageSquare` | Soporte WhatsApp | Notificaciones y gestión por WhatsApp |

### 4. Servicios adicionales

- **Fondo**: gradiente suave primary-50 a secondary-50
- **Título**: `"Personaliza cada detalle"`
- **Subtítulo**: `"Añade servicios de HappyHub directamente desde tu evento"`
- **3 cards** con icono emoji + título + descripción:

  | Emoji | Título | Descripción |
  |---|---|---|
  | 🍽️ | Catering | Menús y bebidas para todos los gustos |
  | 🎨 | Decoración | Transforma el espacio para tu ocasión |
  | 🎉 | Animación | Actividades y entretenimiento para el grupo |

### 5. CTA final

- **Fondo**: gradiente `from-primary-600 via-ocean-600 to-accent-600` (igual que home)
- **Título**: `"¿Listo para organizar tu evento perfecto?"`
- **Subtítulo**: `"Únete a HappyHub y empieza a crear experiencias inolvidables"`
- **Botón**: blanco con texto primary → `/login?redirect=/area-privada`
- **Nota**: `"Registro gratuito · Sin tarjeta de crédito"`

## Navigation change

**Archivo**: `src/components/Header.tsx`

En el array `navItems`, añadir antes del ítem condicional de Área privada:

```typescript
{ href: '/mis-eventos', label: 'Mis Eventos' },
```

El ítem se añade sin condición de sesión — visible para todos.

## SEO

```typescript
<Head>
  <title>Mis Eventos – Organiza eventos colaborativos | HappyHub</title>
  <meta name="description" content="Crea eventos colaborativos con tu grupo. Gestiona invitados, timeline, regalo, fotos y más desde un solo lugar. Con soporte WhatsApp y servicios adicionales." />
</Head>
```
