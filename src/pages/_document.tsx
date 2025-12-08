import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="HappyHub - El espacio perfecto para tus celebraciones" />
        <meta name="keywords" content="eventos, celebraciones, cumpleaños, comuniones, bautizos, Madrid" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="HappyHub - Espacio de Eventos" />
        <meta property="og:description" content="El espacio perfecto para tus celebraciones" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
