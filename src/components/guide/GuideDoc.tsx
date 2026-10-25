import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { KbDocLink, KbRenderedDoc } from '@/lib/kbTypes';
import GuideLayout from './GuideLayout';
import KbDocBody from './KbDocBody';

export interface GuideDocProps {
  basePath: string;
  doc: KbRenderedDoc;
  parent: KbDocLink | null;
  children: KbDocLink[];
}

export default function GuideDoc({ basePath, doc, parent, children, kiosk }: GuideDocProps & { kiosk: boolean }) {
  const back = parent ?? { href: basePath, title: 'Guía de la sala' };

  return (
    <GuideLayout basePath={basePath} kiosk={kiosk} title={doc.title}>
      <Link
        href={back.href}
        className={`inline-flex items-center gap-1 text-primary-600 font-semibold hover:text-primary-700 mb-6 ${kiosk ? 'py-2' : ''}`}
      >
        <ChevronLeft className="w-5 h-5" />
        {back.title}
      </Link>

      <KbDocBody doc={doc} related={children} />
    </GuideLayout>
  );
}
