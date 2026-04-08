# Homepage Redesign — Design System

## Color Palette
| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Primary | `primary-600` | #0D9488 | Nav, links, icon accents |
| Orange/CTA | `orange-500` | #F97316 | Main CTA buttons, highlights |
| Orange light | `orange-50` | #FFF7ED | Warm background tints |
| Dark text | `stone-900` | #1C1917 | Headlines |
| Body text | `gray-600` | #4B5563 | Body copy |
| Background | `white` + `orange-50` | — | Section alternation |

Add to tailwind.config.js:
```js
orange: {
  50:  '#fff7ed', 100: '#ffedd5', 200: '#fed7aa',
  300: '#fdba74', 400: '#fb923c', 500: '#f97316',
  600: '#ea580c', 700: '#c2410c',
}
```

## Typography
- **Font**: Keep Manrope (already loaded, premium, works perfectly)
- **Hero H1**: `text-6xl lg:text-8xl font-bold tracking-tight` — massive, emotional
- **Section titles**: `text-4xl lg:text-5xl font-bold`
- **Body**: `text-lg` with `leading-relaxed`
- **Tags/labels**: All-caps tracking-widest, small

## Section Order (Emotional Journey: Dream → Trust → Act)

```
1. Hero              → Dream: "This is where it happens"
2. TrustBar          → Trust: instant social proof (3 stats)
3. EventTypes        → Dream: "What are you celebrating?"
4. HowItWorks        → Trust: "It's easy — 3 steps"
5. PhotoGallery      → Dream: immersive bento grid
6. PricingTable      → Act: transparent pricing
7. Features          → Trust: "everything included"
8. Reviews           → Trust: real people, real stories
9. Instagram         → Dream: real moments
10. FinalCTA         → Act: strong emotional close
```

## Section-by-Section Design Decisions

### 1. Hero
- **Layout**: Split 50/50 on desktop, stacked on mobile
- **Left**: Orange gradient badge "Espacio para celebrar · Disponible desde Julio 2026" → H1 big bold → Subtitle → 2 CTAs (orange primary + outline secondary)
- **Right**: Hero image in rounded-3xl card + floating WhatsApp badge (keep existing)
- **Background**: Radial gradient warm: `from-orange-50 via-white to-primary-50`
- **No** animated blobs (distracting, cheap)
- **Add**: 3 micro-badges below CTA: "⭐ 4.9/5 · Hasta 50 personas · Respuesta en 24h"

### 2. TrustBar (NEW)
- **Layout**: Horizontal strip, 3 stats separated by dividers
- **Background**: `primary-600` (teal), white text
- **Stats**: "🎂 +500 fiestas · ⭐ 4.9 valoración media · 🚀 Reserva en 2 minutos"
- **No emojis** → Use Lucide icons (PartyPopper, Star, Zap)
- **Style**: Pill-shaped icon container with semi-transparent white bg

### 3. EventTypes
- **Layout**: Horizontal scroll on mobile, 2x2 or 4-col grid on desktop
- **Card design**: Large rounded card, colored icon bg per event type, event name bold, brief description, "Desde X€" price hint
- **Interaction**: hover → orange border + lift shadow
- **Title**: "¿Qué quieres celebrar?"

### 4. HowItWorks (NEW)
- **Layout**: 3-column, numbered steps
- **Steps**: 1. Elige tu fecha → 2. Personaliza tu evento → 3. ¡A celebrar!
- **Design**: Large circle numbers in orange, icon below number, step title, short description
- **Background**: `orange-50` warm section
- **Connection**: Dashed line between step numbers (desktop only)

### 5. PhotoGallery
- **Replace** current carousel/grid with **bento grid**:
  - 1 large photo (col-span-2 row-span-2) + 4 smaller photos
  - Each photo has caption overlay on hover
  - Rounded corners, no gap
- **Title**: "Nuestro espacio te espera"

### 6. PricingTable
- Keep existing component, improve container styling
- Add orange highlight on featured/popular tier
- Section bg: white

### 7. Features
- **Replace** 6-card grid with **2-column list** on desktop
- Icon left, title + description right
- More compact, easier to scan
- Background: `gray-50`

### 8. Reviews
- **Add** aggregate rating hero at top: big "4.9" + 5 stars + "X opiniones"
- Cards: white, shadow-sm, stars prominent in amber
- **Mobile**: horizontal scroll
- **Desktop**: 3-col grid

### 9. Instagram
- Keep existing grid
- Improve hover overlay

### 10. FinalCTA
- **Background**: dark warm (`stone-900`) with orange confetti-dot pattern (CSS radial-gradient dots)
- **Headline**: Much bigger, emotional — "Tu celebración perfecta te está esperando"
- **CTA**: Orange button, large
- **Subtext**: "Sin compromiso · Respuesta en 24h · Pago 100% seguro"

## New Files
| File | Type |
|------|------|
| `src/components/TrustBar.tsx` | NEW component |
| `src/components/HowItWorks.tsx` | NEW component |
| `src/components/BentoGallery.tsx` | NEW (replaces PhotoGallery in homepage) |

## Modified Files
| File | Change |
|------|--------|
| `src/pages/index.tsx` | New section order + new components |
| `src/components/Hero.tsx` | Full redesign |
| `tailwind.config.js` | Add orange color scale |
| `src/styles/globals.css` | Add orange font import (none needed — keep Manrope) |
