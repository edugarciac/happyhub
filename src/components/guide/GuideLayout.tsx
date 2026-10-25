import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';

interface GuideLayoutProps {
  basePath: string;
  title: string;
  description?: string;
  /** Vista de la tablet de la sala (iframe de Home Assistant): sin cabecera de la web y sin indexar */
  kiosk: boolean;
  children: ReactNode;
}

export default function GuideLayout({ basePath, title, description, kiosk, children }: GuideLayoutProps) {
  return (
    <>
      <Head>
        <title>{`${title} - HappyHub`}</title>
        {description && <meta name="description" content={description} />}
        {kiosk && <meta name="robots" content="noindex, nofollow" />}
      </Head>

      {kiosk ? (
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
            <Link href={basePath} className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <BookOpen className="w-6 h-6 text-primary-600" />
              Guía de la sala
            </Link>
          </div>
        </div>
      ) : (
        <div className="pt-24" />
      )}

      <div className={`max-w-4xl mx-auto px-5 ${kiosk ? 'py-6 text-lg' : 'py-10'}`}>{children}</div>
    </>
  );
}
