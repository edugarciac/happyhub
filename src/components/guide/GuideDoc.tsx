import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { KbDocLink, KbRenderedDoc } from '@/lib/kbTypes';
import GuideLayout from './GuideLayout';

export interface GuideDocProps {
  basePath: string;
  doc: KbRenderedDoc;
  parent: KbDocLink | null;
  children: KbDocLink[];
}

export default function GuideDoc({ basePath, doc, parent, children, kiosk }: GuideDocProps & { kiosk: boolean }) {
  const back = parent ?? { href: basePath, title: 'Guía de la sala' };
  const isOperation = doc.type === 'operacion';

  return (
    <GuideLayout basePath={basePath} kiosk={kiosk} title={doc.title}>
      <Link
        href={back.href}
        className={`inline-flex items-center gap-1 text-primary-600 font-semibold hover:text-primary-700 mb-6 ${kiosk ? 'py-2' : ''}`}
      >
        <ChevronLeft className="w-5 h-5" />
        {back.title}
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
          {doc.emoji && <span>{doc.emoji}</span>}
          {doc.title}
        </h1>
        {doc.when && (
          <p className="mt-3 inline-flex items-center gap-2 bg-primary-50 text-primary-700 rounded-full px-4 py-1.5 font-medium">
            <Clock className="w-4 h-4" />
            {doc.when}
          </p>
        )}
      </header>

      {doc.introHtml && (
        <div className="kb-content text-gray-700 leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: doc.introHtml }} />
      )}

      <div className="space-y-6">
        {doc.sections.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className={`scroll-mt-24 ${isOperation && s.heading === 'Pasos' ? 'bg-primary-50 rounded-2xl p-5' : ''}`}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">{s.heading}</h2>
            <div className="kb-content text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.html }} />
          </section>
        ))}
      </div>

      {children.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Relacionado</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {children.map((c) => (
              <Link
                key={c.slug}
                href={c.href}
                className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-200 hover:border-primary-400 p-4"
              >
                <span>
                  <span className="block font-semibold text-gray-900">{c.title}</span>
                  {c.when && <span className="block text-sm text-gray-500 mt-0.5">{c.when}</span>}
                </span>
                <ChevronRight className="w-5 h-5 text-primary-600 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </GuideLayout>
  );
}
