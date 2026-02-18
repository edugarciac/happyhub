# Script de Presentación AWS - HappyHub
## Guía del Speaker (10-15 minutos)

---

## SLIDE 1: PORTADA (30 segundos)

**[Mostrar slide con logo y happyhub.es]**

"Buenos días/tardes. Soy [Tu Nombre] y os voy a presentar **HappyHub**, la plataforma de eventos potenciada por inteligencia artificial que está transformando cómo las familias y empresas organizan sus celebraciones en Barcelona.

A diferencia de un local de eventos tradicional, HappyHub es una **startup tecnológica** que combina un espacio físico premium con una plataforma digital completa, construida sobre la infraestructura de AWS."

**[Pausa, establecer contacto visual]**

---

## SLIDE 2: EL PROBLEMA (1 minuto)

**[Transición a slide del problema]**

"Antes de hablar de tecnología, dejadme explicar el problema que resolvemos.

**[Señalar puntos mientras hablas]**

Organizar un evento hoy es caótico:
- Tienes que contactar con **5 o más proveedores diferentes**: el local, el catering, la decoración, el entretenimiento...
- La coordinación es **manual por WhatsApp y email**, un verdadero caos de mensajes
- Las fotos y vídeos del evento acaban **dispersas entre 20 móviles diferentes**
- Y lo peor: **no sabes cuánto vas a gastar hasta que ya estás comprometido**

**[Dato clave con énfasis]**

De hecho, el 90% de organizadores de eventos dicen que la coordinación de proveedores es su mayor dolor de cabeza. Y es exactamente ahí donde entra HappyHub."

---

## SLIDE 3: LA SOLUCIÓN (1.5 minutos)

**[Transición con energía]**

"HappyHub resuelve esto con una arquitectura de dos capas:

**CAPA FÍSICA:**
**[Gesticular mostrando el espacio]**
- 150 metros cuadrados en Esplugues de Llobregat, Barcelona
- Tres franjas horarias flexibles
- Capacidad operativa de 20 a 40 eventos al mes

Pero aquí está lo interesante...

**CAPA DIGITAL - El Verdadero Diferenciador:**
**[Enumerar con dedos]**

1. **Asistente de IA con AWS Bedrock**: Como tener un event planner profesional 24/7
2. **Creación automática de contenido**: Invitaciones, posts sociales, vídeos de agradecimiento
3. **Impresión 3D personalizada**: Merchandising único para cada evento
4. **Photocall inteligente**: Con edición de fotos por IA usando Rekognition
5. **Marketplace automatizado**: Conectamos clientes con proveedores verificados
6. **Bóveda cloud en S3**: Todos los recuerdos organizados y accesibles para siempre

**[Pausa para impacto]**

Esto no es un local con una web. Es una plataforma tecnológica que da la casualidad de tener un espacio físico."

---

## SLIDE 4: CÓMO FUNCIONA (2 minutos)

**[Transición: "Veamos cómo funciona en la práctica"]**

"El viaje del cliente tiene 4 fases, todas potenciadas por AWS:

**FASE 1: DESCUBRIMIENTO Y RESERVA**
**[Simular gestos de usar móvil]**

Un cliente entra en happyhub.es, ve el calendario en tiempo real conectado a Aurora Database. Nuestro asistente de IA, construido con Bedrock, le pregunta: '¿Qué tipo de evento? ¿Cuántos invitados? ¿Presupuesto?'

Y en **menos de 3 minutos**, tiene una propuesta personalizada y puede reservar. Los workflows de n8n en EC2 orquestan todo automáticamente.

**FASE 2: PLANIFICACIÓN** (2-4 semanas antes)
**[Contar historia]**

María reserva para la comunión de su hija. El sistema genera automáticamente:
- Una web del evento con invitaciones digitales
- Le sugiere caterings de nuestra marketplace
- Le permite pedir regalos personalizados impresos en 3D
- Timeline con recordatorios automáticos vía SNS

Todo mientras ella sigue con su vida normal. Sin coordinación manual.

**FASE 3: DÍA DEL EVENTO**
**[Simular tomar foto]**

Photocall inteligente: cada foto se sube instantáneamente a S3, Lambda las procesa, Rekognition identifica caras y las organiza. Los invitados reciben sus fotos automáticamente en una galería privada.

**FASE 4: POST-EVENTO**
**[Sonreír]**

24 horas después, María recibe un vídeo resumen generado por Bedrock, un álbum perfectamente organizado, y tarjetas de agradecimiento personalizadas. Sus recuerdos están seguros en S3 para siempre.

**[Énfasis]**

Esto es lo que hace la tecnología de AWS. No es solo hosting. Es experiencia."

---

## SLIDE 5: TRACCIÓN ACTUAL (1 minuto)

**[Transición con confianza]**

"¿Dónde estamos ahora?

**[Checkmarks con gesto]**

✅ Plataforma full-stack completa y funcionando
✅ MVP testeado con reservas demo
✅ Espacio físico operativo en Esplugues
✅ Arquitectura AWS diseñada y calculada

Estamos en el punto perfecto: **tecnología validada, esperando infraestructura de producción para lanzar.**

**[Señalar importancia]**

Actualmente estamos en Vercel free tier porque es solo demo. No podemos abrir al público sin una infraestructura robusta. Y ahí es donde el crédito de AWS cambia todo.

Con $1000 USD, podemos lanzar al mercado sin quemar runway. Es exactamente el momento adecuado."

---

## SLIDE 6: MODELO DE INGRESOS (1.5 minutos)

**[Transición: "Hablemos de negocio"]**

"Tenemos tres flujos de ingresos:

**TIER 1: ALQUILER DEL ESPACIO - La Base**
**[Hablar con números claros]**

110 a 170 euros por sesión, dependiendo del día. Con 20 a 40 eventos al mes, son entre 3.600 y 12.000 euros mensuales.

Pero aquí está la magia...

**TIER 2: SERVICIOS DIGITALES - Alto Margen**
**[Énfasis en margen]**

Esto es software. Margen del 80-90%:
- Planificación con IA: 50€
- Pack de contenido personalizado: 80€
- Merchandising 3D: 30-100€
- Photocall inteligente: 120€
- Bóveda cloud: 30€

Promedio: **200 euros extras por evento** en servicios digitales.

**TIER 3: MARKETPLACE - Escalable**

Comisiones del 10-15% en cada proveedor que conectamos. Otros 100 euros por evento.

**[Mostrar cálculo final]**

**Ingreso medio por evento: 450 euros.**

Con 30 eventos al mes, son 13.500 euros mensuales. **162.000 euros anuales.**

Y lo mejor: los costes de AWS son solo 82 euros al mes. El margen es del 99%."

**[Dejar que eso resuene]**

---

## SLIDE 7: ARQUITECTURA AWS (2 minutos)

**[Transición técnica]**

"Ahora, la parte técnica. ¿Por qué AWS?

**[Señalar diagrama]**

Tenemos una arquitectura multi-capa diseñada para escalar:

**FRONTEND:**
Next.js en EC2 o Amplify, conectado a CloudFront para distribución global.

**BACKEND:**
n8n en EC2 t3.small - el cerebro que orquesta Google Calendar, Stripe, emails, todo. 15 euros al mes.

**BASE DE DATOS:**
Aurora Serverless v2. Auto-scaling de 0.5 a 2 ACU. Paga solo por lo que usamos. 25 euros al mes.

**ALMACENAMIENTO:**
S3 para todo el contenido multimedia. CloudFront como CDN. 10 euros al mes combinados.

**INTELIGENCIA ARTIFICIAL:**
**[Enfatizar esto]**
- Bedrock con Claude para el asistente y generación de contenido: 15 euros al mes
- Rekognition para análisis de fotos: 10 euros al mes

Esto es lo que nos diferencia. Nuestros competidores no tienen esto.

**SERVERLESS:**
Lambda para procesamiento de imágenes, webhooks, tareas programadas. 5 euros al mes.

**COMUNICACIÓN:**
SES y SNS para emails y notificaciones. 2 euros al mes.

**[Mostrar total]**

**Total: 82 euros al mes. 984 euros al año.**

**[Mostrar check verde]**

Encaja perfectamente en el crédito de $1000 USD. Un año completo cubierto."

**[Pausa]**

Y esto es solo el inicio. Cuando escalemos a 50-60 eventos, el coste sube a 170 euros. Pero los ingresos suben a 27.000 euros mensuales. El ROI es evidente."

---

## SLIDE 8: VENTAJA COMPETITIVA (1 minuto)

**[Transición con tabla comparativa]**

"¿Por qué vamos a ganar?

**[Recorrer tabla con dedo]**

Locales tradicionales: Tienen espacio físico, pero reservas manuales, cero servicios digitales.

Eventbrite: Tienen reserva online, pero no tienen espacio físico ni servicios digitales.

**HappyHub: Tenemos todo.**

**[Enfatizar el moat]**

Pero lo más importante: **nuestros modelos de IA se entrenan con nuestros datos.**

Cada evento que organizamos hace que nuestro asistente sea más inteligente. Mejor en recomendar caterings, mejores precios, mejores sugerencias.

Eso no se puede copiar. Es nuestra barrera competitiva construida sobre AWS Bedrock."

---

## SLIDE 9: HOJA DE RUTA (1.5 minutos)

**[Transición con energía]**

"Hoja de ruta de 1 año:

**FASE 1: LANZAMIENTO** (Meses 1-3)
**[Gesto de despegue]**

Desplegar AWS, migrar de Vercel, lanzar al público. Objetivo: 25 eventos al mes. 11.250 euros MRR.

**FASE 2: OPTIMIZACIÓN** (Meses 4-6)

Refinar los modelos de IA con datos reales. Cada evento nos hace mejores. Añadir tours virtuales, livestreaming. Objetivo: 35 eventos, 15.750 euros.

**FASE 3: EXPANSIÓN DE SERVICIOS** (Meses 7-9)

Lanzar B2B: eventos corporativos, team buildings. Tiers premium con entretenimiento de alto nivel. Objetivo: 40 eventos + B2B, 20.000 euros.

**FASE 4: PLATAFORMA** (Meses 10-12)
**[Este es el momento clave]**

Aquí es donde se pone interesante. Ofrecemos nuestra plataforma white-label a otros locales de eventos.

**[Pausa dramática]**

Ya no somos un local. Somos **el Shopify de la industria de eventos.**

Objetivo año 1: 50 eventos propios + 2 locales partners. 30.000 euros MRR.

**VISIÓN AÑO 2:**
**[Grandes números]**

10 locales en la red. 500 eventos al mes. 150.000 euros MRR. **1.8 millones de euros anuales.**"

**[Dejar que procesen eso]**

---

## SLIDE 10: LA PETICIÓN (1 minuto)

**[Transición seria, contacto directo]**

"Entonces, ¿qué hacemos con los $1000 USD?

**[Enumerar con claridad]**

✅ Infraestructura de producción para un año completo
✅ Features de IA que competidores no pueden igualar
✅ Base técnica para convertir 1 local en 10 locales
✅ Datos para entrenar mejores modelos

**PRÓXIMOS 30 DÍAS:**
**[Mostrar velocidad]**

Semana 1: Deploy AWS
Semana 2: Migración de Vercel
Semana 3: Lanzamiento público + marketing
Semana 4: Primeros 10 clientes de pago

**MÉTRICAS DE ÉXITO - 90 DÍAS:**

- 75 eventos reservados
- 60% tasa de servicios digitales
- 33.750 euros generados
- 4.5+ estrellas valoración
- **Listos para Serie A**

**[Oportunidades de partnership]**

Más allá del crédito, vemos oportunidad de colaborar con AWS:
- Participar en AWS Activate
- Caso de estudio de Bedrock en eventos
- Charla en eventos AWS Barcelona

**[Cerrar con confianza]**

Este crédito no es solo hosting. Es el catalizador para construir la próxima gran plataforma de eventos en España."

---

## SLIDE 11: GRACIAS + DEMO (1 minuto)

**[Transición final, abrir a Q&A]**

"Muchísimas gracias por vuestro tiempo.

**[Mostrar QR]**

Tenéis aquí el QR para acceder a la demo en happyhub.es. Os invito a probarla.

**[Compartir contacto]**

Mi email es [tu email]. Me encantaría agendar un deep-dive técnico donde os puedo enseñar el código, la arquitectura en detalle, y cómo estamos usando cada servicio de AWS.

**[Frase de cierre potente]**

Con AWS, no estamos solo lanzando una web.
**Estamos construyendo el futuro de los eventos en España.**

¿Preguntas?"

---

## TIPS DE PRESENTACIÓN

### Lenguaje Corporal
- ✅ Mantener contacto visual con diferentes personas
- ✅ Usar gestos naturales para énfasis
- ✅ Moverse ligeramente, no quedarse estático
- ✅ Sonreír cuando hables de casos de uso (María, eventos)
- ✅ Ponerte serio cuando hables de números/técnico

### Timing
- Si vas corto de tiempo: Acortar slides 4 y 7 (combinar fases del customer journey, simplificar arquitectura)
- Si tienes tiempo extra: Añadir historia personal de por qué creaste HappyHub
- Dejar siempre 3-5 min para Q&A

### Manejo de Preguntas Difíciles

**P: "¿Por qué no usar Google Cloud si ya usáis Calendar?"**
R: "Excelente pregunta. Dos razones: 1) El crédito AWS Startups ya aprobado, y 2) Bedrock tiene mejor integración con Claude que Vertex AI con sus modelos. Pero Calendar API funciona perfectamente desde AWS."

**P: "¿Cómo competís con Eventbrite que tiene marca establecida?"**
R: "Eventbrite es marketplace de tickets. Nosotros somos end-to-end. Ellos te venden un boleto, nosotros organizamos toda la experiencia. Diferentes mercados."

**P: "¿Y si otro local copia vuestra idea?"**
R: "Pueden copiar el espacio, pero no pueden copiar nuestros datos. Nuestros modelos de IA mejoran con cada evento. En 6 meses tendremos ventaja imposible de alcanzar."

**P: "¿$1000 es suficiente para un año?"**
R: "Sí, hemos hecho los cálculos conservadores a 82€/mes. Y cuando superemos el crédito, ya estaremos generando 13.500€/mes. El coste AWS será el 0.6% de ingresos."

**P: "¿Qué pasa si AWS sube precios?"**
R: "Los servicios core (EC2, Aurora, S3) son estables en pricing. Y tenemos margen: con 99% de margen bruto, podemos absorber incrementos. Pero también podemos optimizar: Aurora puede bajar a 0.5 ACU en horas valle."

### Energía y Tono
- **Inicio**: Confianza tranquila, establecer credibilidad
- **Problema/Solución**: Energía alta, pintar la visión
- **Técnico**: Calmado, competente, no apurado
- **Números**: Claro, directo, sin exagerar
- **Cierre**: Inspirador pero no sobre-vendido

### Errores a Evitar
- ❌ No leer las slides (ya las están viendo)
- ❌ No usar jerga técnica sin explicar (AWS novatos ok, pero explica ACU, etc.)
- ❌ No minimizar competencia (respeto, pero clara diferenciación)
- ❌ No prometer fechas exactas (evitar "en 2 meses tendremos X")
- ❌ No hablar solo de tecnología - el negocio importa más

---

**¡Éxito en tu presentación! 🚀**
