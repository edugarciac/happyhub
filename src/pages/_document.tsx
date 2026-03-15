import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta charSet="utf-8" />

        {/* Favicon - HappyHub Logo */}
        <link rel="icon" type="image/jpeg" href="/logo-happyhub-white-small.jpeg" />
        <link rel="shortcut icon" type="image/jpeg" href="/logo-happyhub-white-small.jpeg" />
        <link rel="apple-touch-icon" href="/logo-happyhub-white-small.jpeg" />

        {/* Meta tags */}
        <meta name="description" content="HappyHub - Espacio polivalente para todo tipo de celebraciones" />
        <meta name="keywords" content="eventos, celebraciones, cumpleaños, familiares, amigos, colegio, trabajo, espacio polivalente, Barcelona, Esplugues" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="HappyHub - Espacio Polivalente para Eventos" />
        <meta property="og:description" content="Espacio polivalente para celebraciones familiares, con amigos, de colegio y trabajo en Esplugues de Llobregat" />
        <meta property="og:image" content="/logo-happyhub-white-small.jpeg" />
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TJZ7P9WR');` }} />
        {/* End Google Tag Manager */}
      </Head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript dangerouslySetInnerHTML={{ __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TJZ7P9WR" height="0" width="0" style="display:none;visibility:hidden"></iframe>` }} />
        {/* End Google Tag Manager (noscript) */}
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
