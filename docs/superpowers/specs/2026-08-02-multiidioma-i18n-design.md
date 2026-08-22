# Design: Web multiidioma (ES/CA/EN)

**Date:** 2026-08-02
**Status:** Approved
**Scope:** HappyHub — toda la web pública y de cliente (marketing, reserva, área privada, auth). Excluye panel admin y notificaciones automáticas (email/WhatsApp vía n8n).

---

## Resumen

Hoy toda la web (Next.js 14, Pages Router) tiene el texto hardcodeado en español, sin ninguna librería de i18n instalada. El objetivo es soportar **español (por defecto), catalán e inglés** en toda la parte orientada a cliente, dejando fuera de alcance:

- El panel de administración (`/admin/*`).
- El contenido gestionado desde base de datos (nombres de servicios, tipos de evento, tarifas, plantillas de actividades) — se muestra igual en los 3 idiomas, tal cual está hoy en español.
- Las notificaciones automáticas por email/WhatsApp orquestadas por n8n — quedarían para un cambio OpenSpec futuro si hace falta.

Las traducciones a catalán e inglés las escribe Claude como parte de la implementación; se recomienda una revisión humana del catalán/inglés antes de publicar en producción.

---

## 1. Arquitectura base

- `next.config.js`: añadir la config de enrutado i18n nativo de Next:

```js
i18n: {
  locales: ['es', 'ca', 'en'],
  defaultLocale: 'es',
  localeDetection: false,
}
```

- `localeDetection: false` es intencional: con el valor por defecto (`true`), la primera visita de cualquier usuario con el navegador en inglés se redirigiría automáticamente a `/en/...`, lo cual da una experiencia inconsistente para un negocio local y puede confundir a Google al indexar. En su lugar, español es siempre el idioma servido por defecto en `/`, y el usuario cambia de idioma manualmente con un selector.
- Librería: **next-i18next** (sobre i18next + react-i18next). Es el estándar para Pages Router, se apoya en el enrutado i18n nativo de Next, y tiene interpolación y pluralización robustas — importante por el volumen de formularios, mensajes de validación y textos con plurales ("1 invitado" / "2 invitados") del flujo de reserva.
- Instalar `next-i18next`, `react-i18next`, `i18next`. Añadir `next-i18next.config.js` con la configuración de namespaces.
- Envolver `src/pages/_app.tsx` con el HOC `appWithTranslation`.

### URLs resultantes

```
happyhub.es/servicios          → español (default, sin prefijo)
happyhub.es/ca/servicios       → catalán
happyhub.es/en/servicios       → inglés
```

---

## 2. Estructura de archivos de traducción

Los textos se organizan por namespace funcional (no un archivo por página suelta):

```
public/locales/
  es/
    common.json      ← Header, Footer, botones compartidos, mensajes genéricos
    marketing.json   ← Home, cómo-funciona, servicios, partners, contacto
    booking.json     ← disponibilidad, checkout, pagar/[token], confirmación
    account.json     ← área-privada, mis-eventos, facturas, invitación
    auth.json        ← login, register, reset-password, verificación
    legal.json       ← política-privacidad, términos
  ca/  (misma estructura)
  en/  (misma estructura)
```

- Cada página carga solo los namespaces que necesita vía `serverSideTranslations(locale, ['common', 'marketing'])` en `getStaticProps`/`getServerSideProps`, para no mandar al cliente JSON de namespaces que no usa.
- Componentes usan `useTranslation('namespace')` + `t('clave.anidada')`.
- Los mensajes de validación de formularios (Zod, errores) van en el namespace de la página donde aparecen, no en uno aparte.

---

## 3. Selector de idioma

Componente en `Header.tsx` (y versión compacta en `Footer.tsx`) con los 3 idiomas (ES/CA/EN). Al cambiar, usa:

```ts
router.push({ pathname, query }, asPath, { locale: nuevoLocale })
```

Esto mantiene la página y los parámetros actuales, solo cambia el idioma.

---

## 4. Zona admin

El enrutado i18n de Next.js Pages Router se aplica a *todas* las rutas por configuración — no hay forma de excluir `/admin` del prefijo de idioma sin añadir middleware. Esto significa que `/ca/admin/dashboard` y `/en/admin/dashboard` van a existir y ser técnicamente accesibles, pero renderizarán el admin igual que siempre, en español, porque esas páginas no cargan namespaces de traducción ni usan `useTranslation`. No es un problema funcional — nadie llega ahí desde el selector de idioma, y esas rutas no se indexan (ver SEO). Se decide explícitamente no añadir middleware para bloquearlas, dado el beneficio marginal frente a la complejidad añadida.

---

## 5. SEO

- Cada página pública añade etiquetas `hreflang` alternas:

```html
<link rel="alternate" hreflang="es" href=".../pagina" />
<link rel="alternate" hreflang="ca" href="ca/.../pagina" />
<link rel="alternate" hreflang="en" href="en/.../pagina" />
<link rel="alternate" hreflang="x-default" href=".../pagina" />
```

- `/admin/*` (y sus variantes `/ca/admin/*`, `/en/admin/*`) se mantienen con `robots: noindex` y fuera del sitemap.
- `sitemap.xml` (si existe, se revisa al implementar) se amplía para incluir las variantes de idioma de las páginas públicas.

---

## 6. Formato de precios y fechas

El sitio centraliza precios en `src/utils/pricing.ts`. Se añade un util (`src/utils/i18n-format.ts` o extensión de `pricing.ts`) con funciones que usan `Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })` e `Intl.DateTimeFormat(locale)`, para que precios y fechas se muestren con el formato correcto de cada idioma (p. ej. `1.234,56 €` en es/ca vs `€1,234.56` en en), sin tocar la lógica de cálculo de precios en sí.

---

## 7. Contenido dinámico de base de datos — fuera de alcance

Nombres de servicios, tipos de evento, tarifas y plantillas de actividades gestionados desde el panel admin se muestran igual en los 3 idiomas (tal cual están hoy, en español). No se modifica el esquema de base de datos ni el panel admin en este cambio.

---

## 8. Fases de implementación

Dado el tamaño del alcance (~20 páginas públicas + flujo de reserva + área privada, en 3 idiomas), el trabajo se divide en fases dentro del mismo cambio OpenSpec, cada una desplegable y verificable de forma independiente:

1. **Infraestructura + marketing**: setup de next-i18next, selector de idioma, hreflang, y traducción de Home, cómo-funciona, servicios, partners, contacto, legales (política-privacidad, términos).
2. **Flujo de reserva**: disponibilidad, checkout/pagar, confirmación (booking/success, booking/cancel), formularios y mensajes de validación de esa zona.
3. **Área privada y auth**: área-privada, mis-eventos, facturas, invitación, login/register/reset-password/verificación.

---

## 9. Testing

- Verificación manual por fase: recorrer cada página en los 3 idiomas comprobando que no queden claves de traducción sin resolver (`t('clave')` visible literal) ni strings hardcodeadas olvidadas.
- Type-check (`tsc`) y `next build` para detectar imports/namespaces mal referenciados.
- No se añaden tests automatizados de snapshot por idioma — el proyecto no tiene hoy suite de tests de UI, y no es el momento de introducirla solo para esto.

---

## Fuera de alcance (explícito)

- Panel de administración (`/admin/*`) — contenido y textos quedan solo en español.
- Contenido gestionado en base de datos (servicios, tipos de evento, tarifas).
- Notificaciones automáticas por email/WhatsApp vía n8n.
- Tests automatizados de UI/i18n.
