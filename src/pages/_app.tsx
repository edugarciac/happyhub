import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Don't show header/footer on coming soon page (homepage)
  const isComingSoonPage = router.pathname === '/';

  if (isComingSoonPage) {
    return <Component {...pageProps} />;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Component {...pageProps} />
      </main>
      <Footer />
    </>
  );
}
