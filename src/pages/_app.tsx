import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { SessionProvider, useSession } from 'next-auth/react';
import '@/styles/globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VerificationBanner from '@/components/VerificationBanner';
import CookieConsent, { useCookieConsent } from '@/components/CookieConsent';
import { GA_MEASUREMENT_ID, pageview } from '@/lib/analytics';

function AppContent({ Component, pageProps }: { Component: AppProps['Component']; pageProps: any }) {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    const handleRouteChange = (url: string) => pageview(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  const isAuthPage = ['/login', '/register', '/verify-email', '/verificacion-pendiente', '/reset-password'].includes(router.pathname);
  const isAdminPage = router.pathname.startsWith('/admin');

  const showBanner = session?.user &&
    !(session.user as any).emailVerified &&
    !isAuthPage &&
    !isAdminPage;

  if (isAdminPage) {
    return <Component {...pageProps} />;
  }

  return (
    <>
      {showBanner && <VerificationBanner />}
      <Header />
      <main className="min-h-screen">
        <Component {...pageProps} />
      </main>
      <Footer />
    </>
  );
}

function AnalyticsLoader() {
  const consent = useCookieConsent();
  const canLoad = GA_MEASUREMENT_ID && consent === 'accepted';

  if (!canLoad) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', { page_path: window.location.pathname });
          `,
        }}
      />
    </>
  );
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <AnalyticsLoader />
      <AppContent Component={Component} pageProps={pageProps} />
      <CookieConsent />
    </SessionProvider>
  );
}
