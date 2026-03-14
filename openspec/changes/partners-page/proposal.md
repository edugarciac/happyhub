## Why

HappyHub conecta clientes con empresas de servicios para eventos (catering, animacion, decoracion, fotografia, etc.). Actualmente no hay una pagina publica que muestre quienes son estos partners ni que comunique la propuesta de valor para empresas que quieran unirse. Falta una pagina tipo "hub de partners" que:
- De visibilidad a las empresas colaboradoras (incentivo para unirse)
- Transmita confianza al cliente final (trabajan con profesionales verificados)
- Capture nuevos partners interesados en formar parte del hub

## What changes

- Nueva pagina publica `/partners` accesible desde la navegacion principal
- Hero section comunicando HappyHub como hub de empresas colaboradoras para eventos
- Grid/listado de partners actuales con logo, nombre, categoria y breve descripcion
- Seccion CTA "Unete al hub" con formulario de contacto o enlace a contacto
- Datos de partners gestionados como contenido estatico inicial (array en codigo), migrable a DB/CMS cuando haya volumen

## Capabilities

### New capabilities
- `partners-showcase`: Pagina publica con listado de partners colaboradores y CTA para nuevos partners

### Modified capabilities
- Header navigation: nuevo item "Partners" visible para todos los usuarios

## Impact

**New pages:**
- `/partners` - Pagina publica de partners

**UI components:**
- `PartnerCard` - Card con logo, nombre, categoria, descripcion breve del partner
- Hero section reutilizando el patron de otras paginas (gradient background)
- CTA section con mensaje de captacion y boton a contacto

**Navigation:**
- Nuevo item "Partners" en el Header entre "Servicios" y "Reserva tu fecha"

**Data model (fase 1 - estatico):**
```typescript
interface Partner {
  id: string;
  name: string;
  category: string; // catering, animacion, decoracion, fotografia, etc.
  description: string;
  logo?: string; // URL o path a imagen
  website?: string;
  featured?: boolean;
}
```

**Fase 2 (futura, NO en este change):**
- Tabla `partners` en DB
- Admin CRUD para gestionar partners
- Logo upload
- Partner portal con metricas
