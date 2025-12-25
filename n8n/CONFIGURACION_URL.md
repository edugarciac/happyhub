# Configuración de URLs sin Variables de Entorno

Como la funcionalidad de **Environments** (variables de entorno) está disponible solo en el plan Enterprise de n8n, el flujo viene preconfigurado con URLs hardcodeadas. Este documento explica las diferentes opciones según tu caso de uso.

## Configuración por Defecto

El flujo viene configurado con:
- **URL de producción:** `https://happyhub.es`
- **Redirección después de pago:** `https://happyhub.es/mi-reserva/{{$json.id}}`

## Escenarios de Configuración

### 1️⃣ Usar en Producción (Recomendado)

Si tu dominio es `happyhub.es`, no necesitas hacer ningún cambio. El flujo está listo para usar.

✅ **No requiere cambios**

---

### 2️⃣ Usar con Dominio Personalizado

Si tu dominio es diferente (ej: `midominio.com`), debes actualizar la URL en el nodo de Stripe.

#### Pasos:
1. En n8n, abrir el flujo importado
2. Hacer doble clic en el nodo **"Crear Link de Pago Stripe"**
3. Ir a **Additional Fields** → **After Completion** → **URL**
4. Cambiar de:
   ```
   =https://happyhub.es/mi-reserva/{{$json.id}}
   ```
   A:
   ```
   =https://midominio.com/mi-reserva/{{$json.id}}
   ```
5. Hacer clic en **Save** y luego **Execute Workflow**

---

### 3️⃣ Testing Local con ngrok (Desarrollo)

Para probar el flujo en tu máquina local, necesitas usar ngrok para exponer tu servidor local a Internet (Stripe requiere HTTPS).

#### Pasos:

1. **Instalar ngrok:**
   ```bash
   brew install ngrok  # macOS
   # o descargar desde https://ngrok.com
   ```

2. **Iniciar tu servidor Next.js:**
   ```bash
   npm run dev  # Corre en localhost:3000
   ```

3. **Exponer el servidor con ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copiar la URL HTTPS generada** (ej: `https://abc123.ngrok.io`)

5. **Actualizar el nodo de Stripe en n8n:**
   - URL de redirección:
     ```
     =https://abc123.ngrok.io/mi-reserva/{{$json.id}}
     ```

6. **Actualizar también la URL en `.env` de Next.js:**
   ```env
   NEXTAUTH_URL=https://abc123.ngrok.io
   ```

⚠️ **Nota:** La URL de ngrok cambia cada vez que lo reinicias (versión gratuita). Considera usar ngrok con dominio fijo o un servicio como localtunnel.

---

### 4️⃣ Usar con Plan Enterprise de n8n

Si tienes acceso al plan Enterprise, puedes usar variables de entorno:

#### Pasos:

1. **Configurar variable en n8n:**
   - Ir a **Settings** → **Environments**
   - Crear variable: `NEXTAUTH_URL` = `https://happyhub.es`

2. **Actualizar el nodo de Stripe:**
   - Cambiar la URL de:
     ```
     =https://happyhub.es/mi-reserva/{{$json.id}}
     ```
   - A:
     ```
     ={{$env.NEXTAUTH_URL}}/mi-reserva/{{$json.id}}
     ```

3. **Beneficios:**
   - Cambiar la URL desde un solo lugar
   - Tener diferentes URLs por entorno (dev, staging, prod)
   - Más fácil de mantener

---

## Otras URLs que Podrías Necesitar Cambiar

### Email "From" (Remitente)
**Nodo:** "Enviar Email de Confirmación"
- Campo: `fromEmail`
- Valor por defecto: `no-reply@happyhub.es`
- Cambiar a: Tu dominio verificado en tu proveedor SMTP

### Links en el Email
El email HTML incluye enlaces que puedes personalizar:
- Link de ayuda: `contacto@happyhub.es`
- Footer: `© 2024 HappyHub`

Para cambiar:
1. Editar el nodo **"Enviar Email de Confirmación"**
2. Modificar el HTML en el campo **Message**

---

## Configuración Multi-Entorno (Solución Avanzada)

Si necesitas gestionar múltiples entornos sin plan Enterprise, puedes usar esta solución:

### Opción A: Duplicar Flujos por Entorno

1. **Crear 3 flujos separados:**
   - `happyhub-reserva-dev`
   - `happyhub-reserva-staging`
   - `happyhub-reserva-prod`

2. **Cada flujo con su URL:**
   - Dev: `http://localhost:3000` o ngrok
   - Staging: `https://staging.happyhub.es`
   - Prod: `https://happyhub.es`

3. **Activar solo el flujo del entorno actual**

### Opción B: Usar un Nodo de Configuración

Agregar un nodo "Function" al inicio que determine la URL basándose en algún criterio:

```javascript
// Nodo: "Determinar Entorno"
const isProduction = items[0].json.source === 'production';
const baseUrl = isProduction
  ? 'https://happyhub.es'
  : 'https://staging.happyhub.es';

return [{
  json: {
    ...items[0].json,
    baseUrl: baseUrl
  }
}];
```

Luego en el nodo de Stripe usar:
```
={{$node['Determinar Entorno'].json.baseUrl}}/mi-reserva/{{$json.id}}
```

---

## Testing de la Configuración

### Test 1: Verificar Redirección de Stripe

1. Hacer una reserva de prueba
2. Obtener el `paymentLink` de la respuesta
3. Abrir el link en un navegador
4. Completar un pago de prueba (usar tarjeta de test: `4242 4242 4242 4242`)
5. Verificar que redirija a tu dominio correcto

### Test 2: Verificar Email

1. Hacer una reserva con tu email personal
2. Revisar el email recibido
3. Verificar que todos los links funcionen
4. Verificar que el remitente sea correcto

---

## Checklist de Configuración

Antes de poner en producción, verifica:

- [ ] URL de redirección de Stripe actualizada
- [ ] Email "From" configurado con dominio verificado
- [ ] Links en el email funcionan correctamente
- [ ] Variable `N8N_WEBHOOK_URL` en Next.js apunta al webhook correcto
- [ ] Dominios agregados a whitelist de CORS (si aplica)
- [ ] Certificado SSL válido en tu dominio
- [ ] Stripe webhook endpoint configurado correctamente
- [ ] Tests realizados en todos los flujos

---

## Solución de Problemas

### Error: "Invalid redirect URL" en Stripe

**Causa:** La URL de redirección no es HTTPS o no está en la whitelist de Stripe

**Solución:**
1. Verificar que la URL use HTTPS
2. En Stripe Dashboard → Settings → Payment Links → Allowed domains
3. Agregar tu dominio a la lista

### Email no llega

**Causa:** Dominio del remitente no verificado

**Solución:**
1. Verificar tu dominio en tu proveedor SMTP (Gmail, SendGrid, etc.)
2. Configurar registros SPF, DKIM y DMARC
3. Cambiar `fromEmail` en el nodo a un email verificado

### Redirección lleva a localhost en producción

**Causa:** URL hardcodeada incorrecta en el nodo de Stripe

**Solución:**
1. Revisar el nodo "Crear Link de Pago Stripe"
2. Asegurarse de que no diga `localhost` o `ngrok`
3. Cambiar a tu URL de producción

---

## Recursos Adicionales

- [Stripe Payment Links Documentation](https://stripe.com/docs/payment-links)
- [n8n Expression Documentation](https://docs.n8n.io/code-examples/expressions/)
- [ngrok Documentation](https://ngrok.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Actualizado:** 22 de diciembre de 2024
**Versión del flujo:** 1.0
