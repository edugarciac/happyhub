# PROMPT PARA GAMMA.APP - 10 SLIDES

Copia este prompt completo y pégalo en Gamma.app:

---

Crea una presentación profesional de 10 diapositivas para AWS sobre HappyHub, una startup tecnológica de eventos en Barcelona. Usa un diseño moderno y limpio con COLORES AZULES profesionales (azul oscuro para títulos, azul claro para fondos, azul AWS #232F3E como acento). Evita naranjas y turquesas llamativos - mantén paleta profesional corporativa en tonos azules. Incluye iconos y gráficos donde sea apropiado.

---

DIAPOSITIVA 1: PORTADA
Título: HappyHub: La Plataforma de Eventos Potenciada por IA
Subtítulo: Haciendo la planificación profesional de eventos accesible para todos
- Logo: happyhub.es
- Ubicación: Esplugues de Llobregat, Barcelona
- Eslogan: "De la reserva a los recuerdos, todo en una plataforma"
[Imagen sugerida: Espacio de eventos moderno con overlay tecnológico]

---

DIAPOSITIVA 2: PROBLEMA → SOLUCIÓN
Título: De la Fragmentación al End-to-End

EL PROBLEMA:
🎭 5+ proveedores diferentes (local, catering, decoración, entretenimiento)
📧 Coordinación manual caótica (WhatsApp, email)
📸 Recuerdos dispersos entre móviles
💰 Sin transparencia de precios

Dato: "90% organizadores dicen que coordinación es su mayor dolor de cabeza"

LA SOLUCIÓN HAPPYHUB:

CAPA FÍSICA:
- Espacio 150m² en Esplugues de Llobregat
- 3 franjas horarias: Mañana (110-145€), Tarde (110-185€), Noche (consultar)
- Precio según día: L-J (110€), Viernes tarde (155€), Fin semana (145-185€)
- Capacidad: 20-40 eventos/mes

CAPA DIGITAL (El Diferenciador):
🤖 Asistente IA (AWS Bedrock) | 🎨 Contenido personalizado | 🖨️ 3D Printing
📸 Photocall inteligente (Rekognition) | 🌐 Marketplace proveedores | ☁️ Bóveda Cloud (S3)

[Imagen sugerida: Split screen - problema caótico vs solución organizada]

---

DIAPOSITIVA 3: CÓMO FUNCIONA
Título: El Viaje del Cliente - Potenciado por AWS

1. DESCUBRIMIENTO Y RESERVA (Web/Móvil)
   → Disponibilidad en tiempo real (Aurora DB)
   → Asistente IA sugiere paquetes (Bedrock)
   → Confirmación instantánea (n8n workflows en EC2)

2. PLANIFICACIÓN (2-4 semanas antes)
   → Web del evento e invitaciones digitales generadas por IA
   → Selección proveedores verificados del marketplace
   → Pedido merchandising 3D personalizado
   → Timeline y recordatorios automáticos (SNS)

3. DÍA DEL EVENTO
   → Photocall con subidas instantáneas a S3
   → Galería en tiempo real compartida (Lambda + CloudFront)
   → Posts automáticos en redes sociales

4. POST-EVENTO (Recuerdos Para Siempre)
   → Vídeo resumen generado por IA (Bedrock)
   → Álbum organizado con face tagging (Rekognition)
   → Tarjetas agradecimiento auto-generadas

[Imagen sugerida: Timeline horizontal con 4 fases e iconos de AWS services]

---

DIAPOSITIVA 4: TRACCIÓN Y ROADMAP
Título: De Demo a 1.8M€ ARR en 12 Meses

ESTADO ACTUAL (MES 0):
✅ Plataforma full-stack construida (Next.js, n8n, Stripe)
✅ MVP testeado con reservas demo
✅ Espacio operativo en Esplugues
✅ Arquitectura AWS diseñada
🎯 Actualmente: Vercel free tier (solo demo)
🚀 Necesidad: Infraestructura AWS producción para lanzar

HOJA DE RUTA:

FASE 1: LANZAMIENTO (Meses 1-3)
→ Deploy AWS + lanzamiento público
→ Core business: Solo alquiler espacio
→ 25 eventos/mes × 150€ = 3.750€ MRR

FASE 2: VALIDACIÓN (Meses 4-6)
→ Recopilar datos clientes (qué necesitan)
→ Desarrollar primeros servicios digitales con AWS
→ 35 eventos/mes × 150€ = 5.250€ MRR

FASE 3: SERVICIOS DIGITALES (Meses 7-9)
→ Lanzar servicios IA: Asistente, contenido, photocall
→ Primera monetización servicios digitales
→ 40 eventos × 200€ promedio = 8.000€ MRR

FASE 4: OPTIMIZACIÓN (Meses 10-12)
→ Refinar attach rate servicios (target 60%)
→ Añadir marketplace comisiones
→ 50 eventos × 250€ promedio = 12.500€ MRR

VISIÓN AÑO 2:
→ Servicios digitales activos (attach rate 40-60%)
→ 40 eventos × 250€ = 10.000€ MRR = 120K€ ARR

VISIÓN AÑO 3:
→ Optimización capacidad (50 eventos/mes)
→ 50 eventos × 250€ = 12.500€ MRR = 150K€ ARR

VISIÓN AÑO 4-5 (EXPANSIÓN SOSTENIBLE):
→ Apertura segundo local (Año 4)
→ Crecimiento a 5 locales total (Año 5)
→ 5 locales × 30 eventos × 250€ = 37.500€ MRR = 450K€ ARR

Modelo: Crecimiento sostenible, no agresivo. Cada local validado antes de siguiente.

[Imagen sugerida: Línea temporal ascendente con hitos]

---

DIAPOSITIVA 5: MODELO DE INGRESOS
Título: Estrategia de Crecimiento - De Espacio a Plataforma

AÑO 1: CORE BUSINESS - ALQUILER DE ESPACIO
- Rango precios: 110-185€/sesión según día y franja
  • L-V mañanas: 110€ | L-J tardes: 110€
  • Viernes/vísperas tardes: 155€
  • Fin semana mañanas: 145€ | Fin semana tardes: 185€
- Ingreso promedio: 150€/evento (60% fin semana, 40% laborables)
- Target mes 3: 25 eventos/mes
- Target mes 12: 40 eventos/mes

PROYECCIÓN AÑO 1:
25-40 eventos × 150€ = 3.750-6.000€ MRR = 45.000-72.000€ ARR
(Precio espacio NO sube - mantenemos competitividad)

AÑO 2-5: ESPACIO + SERVICIOS DIGITALES (AWS-Powered)
Con infraestructura AWS desarrollamos servicios premium:

TIER 2: SERVICIOS DIGITALES (Alto Margen 85%)
- Pack Básico Digital: 50€ (invitaciones IA + álbum cloud)
- Pack Premium: 100€ (básico + photocall + edición fotos)
→ Target realista: +50-100€/evento promedio
→ Attach rate conservador: 40-60% de clientes

TIER 3: MARKETPLACE COMISIÓN (Opcional)
- Catering, DJ, decoración: 10-15% comisión
→ Potencial adicional: +30-50€/evento

PROYECCIONES CONSERVADORAS:

AÑO 2: 40 eventos × 250€ = 10.000€ MRR = 120.000€ ARR

AÑO 3: 50 eventos × 250€ = 12.500€ MRR = 150.000€ ARR

AÑO 5 (5 LOCALES): 150 eventos × 250€ = 37.500€ MRR = 450.000€ ARR

Nota: Precio espacio (150€) no sube. Crecimiento viene de servicios digitales y más locales.

[Imagen sugerida: Gráfico de barras apiladas o pirámide de ingresos]

---

DIAPOSITIVA 6: ARQUITECTURA AWS
Título: Por Qué AWS Impulsa Nuestro Crecimiento

[DIAGRAMA SIMPLIFICADO]:

CLIENTE (happyhub.es)
    ↓ CloudFront
FRONTEND (EC2/Amplify) → Next.js App
    ↓
┌─────────────┬──────────────────┐
│ Aurora DB   │  n8n Workflows   │
│ PostgreSQL  │  (EC2 t3.small)  │
│             │                  │
│• Reservas   │• Google Calendar │
│• Clientes   │• Stripe Payments │
│• Servicios  │• Email (SES)     │
└─────────────┴──────────────────┘
         ↓
┌──────────┬──────────┬──────────┐
│ Bedrock  │  Lambda  │    S3    │
│  Claude  │ Functions│  Media   │
│ IA Agent │ • Resize │ • Fotos  │
│ Content  │ • Rekogn │ • Vídeos │
└──────────┴──────────┴──────────┘

SERVICIOS AWS | COSTE MENSUAL:
• EC2 t3.small (n8n): 15€
• Aurora Serverless v2: 25€
• S3 + CloudFront: 10€
• Bedrock Claude IA: 15€
• Lambda + Rekognition: 15€
• SES + SNS: 2€

TOTAL: 82€/mes = 984€/año
✅ ENCAJA EN $1000 USD

MARGEN: 99.4% (82€ coste vs 13.500€ ingresos)

[Imagen sugerida: Diagrama arquitectura con logos servicios AWS]

---

DIAPOSITIVA 7: VENTAJA COMPETITIVA
Título: Por Qué HappyHub Gana

[TABLA COMPARATIVA]:

Característica | Local Tradicional | Eventbrite | HappyHub
Espacio Físico | ✅ | ❌ | ✅
Reserva Online | ⚠️ (manual) | ✅ | ✅
Asistente IA | ❌ | ❌ | ✅
Creación Contenido | ❌ | ❌ | ✅
Impresión 3D | ❌ | ❌ | ✅
Marketplace Proveedores | ❌ | ❌ | ✅
Smart Photos + Cloud | ❌ | ❌ | ✅
Experiencia End-to-End | ❌ | ❌ | ✅

NUESTRO MOAT:
Modelos de IA propietarios entrenados con nuestros datos

→ Cada evento = Mejores recomendaciones
→ En 6 meses: 180 eventos de datos únicos
→ Competidores tardan 12-18 meses en alcanzarnos
→ IMPOSIBLE DE COPIAR

DIFERENCIACIÓN DE MERCADO:
• Eventbrite: Marketplace tickets eventos públicos
• HappyHub: Plataforma end-to-end eventos privados

[Imagen sugerida: Tabla visual con checkmarks destacando ventajas HappyHub]

---

DIAPOSITIVA 8: UNIT ECONOMICS
Título: Métricas que Importan - Modelo Conservador y Realista

COSTE ADQUISICIÓN CLIENTE (CAC):
• Orgánico (SEO/Boca a boca): 15€ (40% de bookings)
• Google Ads: 40€ (30% de bookings)
• Social Media: 30€ (30% de bookings)
→ CAC Promedio Ponderado: 25€/cliente

LIFETIME VALUE (LTV):
• Cliente promedio: 1.5 eventos/año (cumpleaños + otro evento familiar)
• Duración: 3 años (mientras hijos en edad celebraciones)

AÑO 1 (Solo Espacio):
• LTV = 150€ × 1.5 × 3 años = 675€
• LTV:CAC = 27:1 (Excelente - >3:1 es saludable)

AÑO 2+ (Con Servicios Digitales):
• LTV = 250€ × 1.5 × 3 años = 1.125€
• LTV:CAC = 45:1 (Extraordinario)

ROI SOBRE INVERSIÓN AWS:
• Inversión AWS año 1: 984€
• Ingresos año 1: 45.000-72.000€ (conservador)
• ROI: 4.574% - 7.317% (46x - 73x retorno)
• Break-even: 7 eventos cubren coste AWS anual

MARGEN OPERATIVO:
AÑO 1:
• Ingresos: 4.500€/mes (30 eventos × 150€)
• AWS coste: 82€/mes
• Margen: 98.2% (solo costes AWS, sin staff/alquiler local)

AÑO 2:
• Ingresos: 10.000€/mes (40 eventos × 250€)
• AWS coste: 100€/mes (más uso servicios IA)
• Margen: 99.0%

AÑO 5 (5 LOCALES):
• Ingresos: 37.500€/mes (150 eventos × 250€)
• AWS coste: 250€/mes (multi-tenant optimizado)
• Margen: 99.3%

[Imagen sugerida: Gráficos circulares o métricas destacadas con números grandes]

---

DIAPOSITIVA 9: ESCALABILIDAD TÉCNICA
Título: Crecimiento Sostenible - De 1 a 5 Locales en 5 Años

ARQUITECTURA ACTUAL (1 LOCAL - AÑO 1):
1 EC2 → 1 Aurora → 1 Local
Coste: 82€/mes
Capacidad: 50 eventos/mes

ARQUITECTURA ESCALADA (5 LOCALES - AÑO 5):
1 ECS Cluster (multi-tenant) → 1 Aurora (partitioned) → 5 Locales
Coste: 250€/mes = 50€/local
Capacidad: 150 eventos/mes total

POR QUÉ MULTI-TENANT ES CLAVE:
• Bedrock: Compartido entre todos los locales con rate limiting
• Aurora: Una sola base de datos con tenant_id, no 5 bases separadas
• S3: Un bucket con prefixing por local (s3://happyhub/local-001/...)
• CloudFront: Una distribución CDN para todos
• Lambda/Rekognition: Funciones compartidas

ECONOMÍAS DE ESCALA:
• 1 local: 82€/mes (82€ por local)
• 3 locales: 180€/mes (60€ por local)
• 5 locales: 250€/mes (50€ por local)

EXPANSIÓN BARCELONA (AÑOS 4-5):
• Local 2: Gracia (Año 4)
• Local 3: Sarrià (Año 4)
• Local 4: Eixample (Año 5)
• Local 5: Sant Gervasi (Año 5)
Foco: Consolidar Barcelona antes de salir a otras ciudades

INGRESOS ESCALADO (5 LOCALES - AÑO 5):
5 locales × 30 eventos × 250€ = 37.500€/mes
AWS coste 250€ = 0.67% de revenue (margen 99.33%)

MODELO SOSTENIBLE:
→ No abrir nuevo local hasta que anterior sea rentable
→ Validar cada ubicación 6-12 meses antes de siguiente
→ Prioridad: Calidad sobre cantidad

[Imagen sugerida: Diagrama expansión geográfica Europa o gráfico escalado]

---

DIAPOSITIVA 10: LA PETICIÓN + CIERRE
Título: Cómo AWS Acelera Nuestro Viaje - Partnership Estratégico

LO QUE CONSTRUIMOS CON $1000 USD:
✅ Infraestructura producción 1 año completo
✅ Features IA imposibles para competencia
✅ Base escalable para 10+ locales (plataforma)
✅ Infraestructura datos = mejores modelos IA

PRÓXIMOS 30 DÍAS:
1️⃣ Semana 1: Deploy arquitectura AWS
2️⃣ Semana 2: Migración Vercel → AWS
3️⃣ Semana 3: Lanzamiento público + marketing
4️⃣ Semana 4: Primeros 10 clientes de pago

MÉTRICAS ÉXITO (90 DÍAS):
• 75 eventos reservados vía plataforma
• 11.250€ revenue generado (75 × 150€)
• 4.5+ estrellas rating promedio
• Feedback clientes recopilado para desarrollar servicios digitales
• Base de datos 75 eventos para entrenar modelos IA
• ✅ Proof of concept validado, listos para Serie A

OPORTUNIDADES PARTNERSHIP:
→ AWS Activate Program
→ Caso estudio Bedrock en eventos (1º en España)
→ Speaking en AWS Startups Barcelona

MÁS ALLÁ DEL CRÉDITO:
• Path claro: 1K€ hoy → 3K€/año Año 2 → 15K€/año Año 5
• Reference customer para vender Bedrock a hospitality/tourism
• 50 locales en plataforma = 50x revenue AWS

---

CIERRE:

🌐 Demo en vivo: happyhub.es
📧 Contacto: [tu-email]@happyhub.es
📱 Agendemos deep-dive técnico

[CÓDIGO QR grande a happyhub.es]

"Con AWS, no solo lanzamos una web.
Construimos el futuro de los eventos en España."

¿Preguntas?

[Imagen sugerida: Logo HappyHub + AWS juntos, código QR, fondo inspirador]
