import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta charSet="utf-8" />

        {/* Favicon - HappyHub Logo */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />

        {/* Meta tags */}
        <meta name="description" content="HappyHub - Espacio polivalente para todo tipo de celebraciones" />
        <meta name="keywords" content="eventos, celebraciones, cumpleaños, familiares, amigos, colegio, trabajo, espacio polivalente, Barcelona, Esplugues" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="HappyHub - Espacio Polivalente para Eventos" />
        <meta property="og:description" content="Espacio polivalente para celebraciones familiares, con amigos, de colegio y trabajo en Esplugues de Llobregat" />
        <meta property="og:image" content="/favicon.jpeg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
