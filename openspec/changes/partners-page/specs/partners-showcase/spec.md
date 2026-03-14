# Partners showcase

## Description
Pagina publica que muestra los partners colaboradores de HappyHub y permite a nuevas empresas expresar interes en unirse al hub.

## Acceptance scenarios

### SC-01: Pagina accesible sin autenticacion
- GIVEN un usuario no autenticado
- WHEN navega a `/partners`
- THEN ve la pagina completa con hero, grid de partners y CTA

### SC-02: Partners visibles en grid
- GIVEN la pagina de partners
- WHEN se carga
- THEN muestra todos los partners en un grid responsive (1 col mobile, 2 col tablet, 3 col desktop)

### SC-03: Card de partner muestra informacion
- GIVEN un partner en el grid
- THEN muestra: nombre, categoria (con icono), descripcion breve, y logo (o icono fallback)

### SC-04: Navegacion incluye partners
- GIVEN cualquier pagina del sitio
- WHEN miro la navegacion principal
- THEN veo "Partners" entre "Servicios" y "Reserva tu fecha"

### SC-05: CTA unete al hub
- GIVEN la seccion CTA al final de la pagina
- WHEN hago click en el boton de contacto
- THEN navego a `/contacto`

### SC-06: Partners con website tienen enlace
- GIVEN un partner que tiene website definido
- WHEN miro su card
- THEN veo un enlace externo a su web (abre en nueva pestana)

### SC-07: Responsive design
- GIVEN la pagina de partners en movil
- THEN las cards se muestran en una columna
- AND el hero es legible sin scroll horizontal

### SC-08: Meta tags SEO
- GIVEN la pagina de partners
- THEN tiene title "Partners - HappyHub" y meta description relevante

## Functional requirements

### FR-01: Renderizar lista de partners desde array estatico
### FR-02: Mostrar card por partner con nombre, categoria, descripcion, logo/fallback
### FR-03: Grid responsive: 1/2/3 columnas segun viewport
### FR-04: Hero section con titulo y descripcion del hub
### FR-05: CTA section con boton a /contacto
### FR-06: Link externo a website del partner (target="_blank", rel="noopener")
### FR-07: Icono por categoria como fallback cuando no hay logo
### FR-08: Item "Partners" en navegacion principal del Header
### FR-09: Meta tags title y description para SEO
