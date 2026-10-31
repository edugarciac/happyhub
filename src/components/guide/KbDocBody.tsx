import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';
import type { KbDocLink, KbRenderedDoc } from '@/lib/kbTypes';

interface KbDocBodyProps {
  doc: KbRenderedDoc;
  related: KbDocLink[];
}

/** Título, secciones y documentos relacionados de un documento de la KB (guía o manual interno) */
export default function KbDocBody({ doc, related }: KbDocBodyProps) {
  const isOperation = doc.type === 'operacion';

  return (
    <>
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

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Relacionado</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {related.map((c) => (
              <Link
                key={c.slug}
                href={c.href}
                className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-200 hover:border-primary-400 p-4"
              >
                <span>
                  <span className="block font-semibold text-gray-900">{c.title}</span>
                  {(c.when ?? c.summary) && <span className="block text-sm text-gray-500 mt-0.5">{c.when ?? c.summary}</span>}
                </span>
                <ChevronRight className="w-5 h-5 text-primary-600 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
