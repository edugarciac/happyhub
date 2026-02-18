# 📊 Guía Completa - Presentación AWS HappyHub

Este directorio contiene todos los materiales necesarios para tu presentación a AWS Startups Program.

---

## 📁 Archivos Creados

### 1. **Prompt para Gamma.app** - ACTUALIZADO A 10 SLIDES
- **Archivo:** `docs/PROMPT_GAMMA_10_SLIDES.md`
- Copia el prompt completo desde ese archivo
- Pégalo en gamma.app para generar presentación automáticamente
- **Duración:** ~2 minutos para generar 10 slides profesionales

### 2. **AWS_COST_BREAKDOWN.csv** (2.3KB)
- Desglose detallado de costes AWS por servicio
- Proyecciones mensuales y anuales
- Análisis ROI: 164x retorno sobre inversión AWS
- Escenarios de escalado (20, 30, 40, 50 eventos/mes)
- **Uso:** Anexo a presentación, responder preguntas de costes

### 3. **AWS_ARCHITECTURE.puml** (3.6KB)
- Diagrama PlantUML de arquitectura completa AWS
- Incluye: EC2, Aurora, Bedrock, S3, Lambda, Rekognition, SES, SNS
- **Cómo visualizar:**
  ```bash
  # Opción 1: Online
  # Abre https://www.plantuml.com/plantuml/uml/ y pega el contenido

  # Opción 2: Local (si tienes PlantUML)
  java -jar plantuml.jar docs/AWS_ARCHITECTURE.puml
  # Genera: AWS_ARCHITECTURE.png
  ```
- **Uso:** Slide 7 de presentación (ya incluido en prompt Gamma)

### 4. **PRESENTACION_AWS_SCRIPT.md** (13KB)
- Script palabra por palabra para 10-15 minutos
- Notas del speaker para cada slide
- Tips de lenguaje corporal, timing, manejo de preguntas
- Errores comunes a evitar
- **Uso:** Leer antes de presentar, practicar 2-3 veces

### 5. **HAPPYHUB_ONE_PAGER.md** (6.4KB)
- Resumen ejecutivo de 2 páginas
- Todo lo esencial: problema, solución, métricas, arquitectura, roadmap
- **Uso:**
  - Enviar por email después de presentación
  - Dejar impreso para que AWS revise después
  - Convertir a PDF con:
    ```bash
    # Opción 1: Pandoc
    pandoc HAPPYHUB_ONE_PAGER.md -o HAPPYHUB_ONE_PAGER.pdf

    # Opción 2: Online
    # Abre https://www.markdowntopdf.com/ y sube el archivo
    ```

### 6. **FAQ_AWS_PRESENTATION.md** (30KB)
- 18 preguntas anticipadas con respuestas detalladas
- Categorías: Arquitectura, Negocio, Escalabilidad, Seguridad, Programa AWS, Métricas, Riesgos
- **Uso:**
  - Leer completo 1 día antes de presentación
  - Repasar sección por sección
  - Preparar respuestas mentales

---

## 🚀 Cómo Crear la Presentación en Gamma

### Paso 1: Registro en Gamma
1. Ve a https://gamma.app
2. Click "Sign Up" (gratis, no necesitas tarjeta)
3. Registra con email o Google

### Paso 2: Crear Presentación
1. Click "Create with AI" o "Crear con IA"
2. Selecciona "Presentation"
3. **Copia el prompt completo** desde arriba (empieza con "Crea una presentación profesional...")
4. Pégalo en el campo de texto
5. Click "Generate" o "Generar"
6. ⏳ Espera ~2 minutos

### Paso 3: Personalizar
Una vez generada la presentación:

**Colores:**
- Tema: Elige "Professional" o "Modern"
- Color primario: Azul AWS (#FF9900 naranja accent)
- Color secundario: Turquesa HappyHub (#06B6D4)

**Logo:**
- Slide 1: Añadir logo HappyHub (si tienes)
- Footer: Añadir "happyhub.es"

**Imágenes:**
- Gamma sugiere imágenes automáticamente
- Reemplaza con fotos reales de tu espacio si las tienes
- Slide 7 (arquitectura): Sube AWS_ARCHITECTURE.png generado desde .puml

**Contacto:**
- Slide 11: Añadir tu email real
- Generar QR code: https://www.qr-code-generator.com/ → URL: https://happyhub.es

### Paso 4: Exportar
- Click "Export" → Selecciona "PDF" o "PowerPoint"
- PDF: Para enviar por email
- PPTX: Si necesitas editar más en PowerPoint/Keynote

---

## 📋 Checklist Pre-Presentación

### 1 Semana Antes
- [ ] Crear presentación en Gamma
- [ ] Leer FAQ_AWS_PRESENTATION.md completo
- [ ] Leer PRESENTACION_AWS_SCRIPT.md completo
- [ ] Convertir HAPPYHUB_ONE_PAGER.md a PDF
- [ ] Generar diagrama AWS_ARCHITECTURE.png

### 3 Días Antes
- [ ] Practicar presentación 1 vez (solo, con timer 15 min)
- [ ] Identificar slides donde te trabas
- [ ] Preparar respuestas a top 5 preguntas FAQ

### 1 Día Antes
- [ ] Practicar presentación 2 veces (con alguien si es posible)
- [ ] Repasar números clave (82€/mes, 450€/evento, 13.500€ MRR)
- [ ] Verificar demo de happyhub.es funciona
- [ ] Cargar laptop, backup en USB

### Día De
- [ ] Llegar 15 min antes
- [ ] Probar proyector/pantalla
- [ ] Verificar Internet (para demo)
- [ ] Respirar profundo 🧘
- [ ] **¡A romperla! 🚀**

---

## 🎯 Estructura de la Presentación (Resumen) - 10 SLIDES

| Slide | Tema | Tiempo | Key Message |
|-------|------|--------|-------------|
| 1 | Portada | 30s | Somos tech startup, no venue tradicional |
| 2 | Problema → Solución | 1.5m | De caos a plataforma end-to-end |
| 3 | Cómo Funciona | 2m | Customer journey potenciado por AWS |
| 4 | Tracción + Roadmap | 1.5m | Demo listo → 1.8M€ ARR en 12 meses |
| 5 | Ingresos | 1.5m | 3 streams, 450€/evento, margen 99% |
| 6 | Arquitectura AWS | 2m | 8 servicios, 82€/mes, encaja en $1000 |
| 7 | Ventaja Competitiva | 1m | IA propietaria = moat imposible copiar |
| 8 | Unit Economics | 1.5m | LTV:CAC 65:1, ROI 164x |
| 9 | Escalabilidad | 1.5m | 1 local → 100 locales, multi-tenant |
| 10 | La Petición + Cierre | 1.5m | Partnership estratégico + demo |
| **TOTAL** | | **14-15m** | Perfecto para Q&A |

---

## 💡 Tips Finales

### Lenguaje Corporal
- ✅ Contacto visual con diferentes personas
- ✅ Sonreír cuando hables de customer stories
- ✅ Gestos naturales (manos, no bolsillos)
- ✅ Moverte ligeramente (no estatua)

### Qué Enfatizar
1. **No somos un venue con web, somos plataforma tech con espacio**
2. **Bedrock/IA es nuestro diferenciador** (competencia no lo tiene)
3. **Path claro a 10 locales** (no quedamos en 1 ciudad)
4. **82€/mes AWS, 13.500€/mes revenue** (margen brutal)
5. **Queremos partnership, no solo $1K** (largo plazo)

### Qué Minimizar
- ❌ Detalles técnicos innecesarios (no explicar qué es ACU salvo que pregunten)
- ❌ Comparaciones negativas de competencia (respeto, pero clara diferencia)
- ❌ Promesas exageradas ("seremos unicornio en 2 años")
- ❌ Pedir más dinero que $1K (enfoque en valor, no pedir más credits)

### Si Te Quedas Sin Tiempo
**Acortar:**
- Slide 3 (Customer Journey): Resume a 2 fases en vez de 4
- Slide 9 (Escalabilidad): Solo menciona multi-tenant, skip internacional

**Nunca Acortar:**
- Slide 2 (Problema→Solución) - Es el corazón
- Slide 5 (Ingresos) - Necesitan ver unit economics
- Slide 6 (Arquitectura AWS) - Es el core técnico
- Slide 10 (La Petición) - Es el CTA

---

## 📞 Soporte y Recursos

### Generador QR Code
- https://www.qr-code-generator.com/

### Markdown to PDF
- https://www.markdowntopdf.com/
- O: `pandoc archivo.md -o archivo.pdf`

### PlantUML Viewer Online
- https://www.plantuml.com/plantuml/uml/

### Gamma.app Help
- https://help.gamma.app/

### AWS Startup Resources
- https://aws.amazon.com/startups
- https://aws.amazon.com/activate/

---

## 📊 Project Memory Actualizada

Se ha documentado en `docs/project_notes/`:

✅ **decisions.md** → ADR-006: Migración a AWS Infrastructure
✅ **key_facts.md** → AWS services, costes, arquitectura, revenue model
✅ **issues.md** → Trabajo en progreso: Preparación presentación AWS

---

## 🎬 Siguiente Paso

1. **Ahora:** Crear presentación en Gamma (5 minutos)
2. **Hoy:** Leer FAQ completo (30 minutos)
3. **Mañana:** Primera práctica (15 minutos)
4. **Antes del día:** Practicar 2-3 veces más

---

**¡Mucha suerte con la presentación! 🚀**

Si tienes dudas, consulta el FAQ o pregúntame. Estoy aquí para ayudarte a conseguir esos $1000 y construir el futuro de los eventos en España.

**happyhub.es** | powered by AWS
