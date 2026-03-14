## Context

HappyHub tiene paginas publicas siguiendo un patron consistente: Hero con gradient, secciones de contenido en white/gray-50, CTAs al final. Los servicios (catering, animacion, decoracion, fotografia, tarta) estan en `/servicios` como datos estaticos en un array. La pagina de partners sigue el mismo patron pero orientada a las empresas que proveen esos servicios.

Existe `/proveedores` como panel privado para proveedores (gestion de solicitudes). La nueva pagina `/partners` es publica y distinta: escaparate del hub.

## Goals / Non-goals

**Goals:**
- Pagina publica que muestre partners actuales con aspecto profesional
- Transmitir que HappyHub es un hub de empresas colaboradoras, no un proveedor unico
- CTA claro para captar nuevos partners interesados
- Consistente con el diseno visual del resto del sitio

**Non-goals:**
- No es un directorio de busqueda con filtros avanzados
- No es un marketplace donde el cliente contrata directamente al partner
- No incluye gestion dinamica de partners (eso es fase 2)
- No requiere autenticacion para ver la pagina

## Decisions

### 1. Datos estaticos en codigo

**Decision**: Partners como array TypeScript en el propio componente de la pagina, igual que servicios.tsx.

**Rationale**: No hay volumen que justifique DB ahora. Cuando crezca, se migra a tabla `partners` con admin CRUD. Mantener simple.

### 2. Estructura de la pagina

**Decision**: 3 secciones:
1. **Hero**: Titulo "Nuestros partners" + subtitulo explicando el concepto de hub colaborativo
2. **Grid de partners**: Cards con logo placeholder/real, nombre, categoria y descripcion
3. **CTA "Unete al hub"**: Texto invitando a empresas a contactar + boton a `/contacto`

**Rationale**: Sigue el patron exacto de servicios.tsx y como-funciona.tsx. Familiar para el usuario.

### 3. Navegacion

**Decision**: Anadir "Partners" al menu principal entre "Servicios" y "Reserva tu fecha".

**Rationale**: Es contenido publico relevante para ambos targets (clientes y empresas). Posicion logica despues de servicios.

### 4. Categorias de partners

**Decision**: Usar las mismas categorias que los servicios existentes (catering, animacion, decoracion, fotografia) mas categorias adicionales que apliquen (venue, musica, transporte).

**Rationale**: Coherencia con el catalogo de servicios. El partner se asocia a la categoria de servicio que provee.

## Risks / Trade-offs

- **Partners sin logo real**: Inicialmente algunos partners pueden no tener logo. Usar icono de categoria como fallback.
- **Pagina vacia al principio**: Si hay pocos partners, la pagina puede parecer pobre. Mitigacion: empezar con al menos 4-5 partners (aunque sean placeholder) y un mensaje tipo "Estamos creciendo, unete".
- **SEO**: La pagina es buena para SEO local ("empresas de catering para eventos en [ciudad]"). Asegurar meta tags.
