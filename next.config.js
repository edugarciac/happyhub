/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV !== 'production' ? "'unsafe-eval' " : ''}https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "frame-src https://js.stripe.com",
      "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://vercel.com",
    ].join('; '),
  },
]

// /guia-sala/panel se muestra dentro de un iframe en el panel de Home Assistant de la sala.
// Solo esa ruta puede embeberse, y solo desde la web y desde Home Assistant en la red local.
// frame-ancestors compara esquema, host y puerto exactos: HA escucha en el 8123.
const HA_ORIGINS = [
  'http://homeassistant.local:8123',
  'http://192.168.100.116:8123',
  'http://homeassistant.local',
  'https://homeassistant.local',
].join(' ')

const kioskHeaders = securityHeaders
  .filter((h) => h.key !== 'X-Frame-Options')
  .map((h) =>
    h.key === 'Content-Security-Policy'
      ? { ...h, value: `${h.value}; frame-ancestors 'self' ${HA_ORIGINS}` }
      : h
  )

const nextConfig = {
  reactStrictMode: false, // Disabled to prevent double rendering issues
  images: {
    domains: ['localhost', 'scontent.cdninstagram.com', 'scontent-mad1-1.cdninstagram.com'],
    // Imágenes subidas desde el admin (Vercel Blob)
    remotePatterns: [{ protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }],
    unoptimized: false, // Vercel has native image optimization
  },
  serverRuntimeConfig: {
    // Server-side runtime variables
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://www.happyhub.es',
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  experimental: {
    // El manual interno se lee del disco en cada petición (solo admins): incluirlo en esas funciones
    outputFileTracingIncludes: {
      '/admin/manual': ['./content/interno/**/*'],
      '/admin/manual/[...slug]': ['./content/interno/**/*'],
    },
  },
  async headers() {
    return [
      { source: '/((?!guia-sala/panel(?:/|$)).*)', headers: securityHeaders },
      { source: '/guia-sala/panel', headers: kioskHeaders },
      { source: '/guia-sala/panel/:path*', headers: kioskHeaders },
    ]
  },
}

module.exports = nextConfig
