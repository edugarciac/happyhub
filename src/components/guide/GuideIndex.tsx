import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronRight, Zap } from 'lucide-react';
import type { KbDocLink, KbRenderedDoc } from '@/lib/kbTypes';
import GuideLayout from './GuideLayout';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

export interface GuideIndexProps {
  basePath: string;
  panel: KbRenderedDoc;
  operations: KbDocLink[];
  zones: KbDocLink[];
  hubs: KbDocLink[];
}

function DocCard({ doc, kiosk }: { doc: KbDocLink; kiosk: boolean }) {
  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
      <Link href={doc.href} className="flex items-center gap-2 font-bold text-gray-900 hover:text-primary-600">
        {doc.emoji && <span className="text-2xl">{doc.emoji}</span>}
        {doc.title}
      </Link>
      <ul className={`mt-3 space-y-2 ${kiosk ? 'text-base' : 'text-sm'}`}>
        {doc.questions.map((q) => (
          <li key={q.id}>
            <Link href={`${doc.href}#${q.id}`} className="text-gray-600 hover:text-primary-600">
              {q.heading}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function GuideIndex({ basePath, panel, operations, zones, hubs, kiosk }: GuideIndexProps & { kiosk: boolean }) {
  return (
    <GuideLayout
      basePath={basePath}
      kiosk={kiosk}
      title="Guía de la sala"
      description="Cómo usar la sala de HappyHub: panel de control, luces, aire, música y normas."
    >
      {!kiosk && (
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Guía de la sala</h1>
          <p className="text-xl text-gray-600">Todo lo que necesitas para disfrutar de la sala el día de tu evento.</p>
        </header>
      )}

      {/* Punto de partida: el panel de control */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-6 md:p-8 mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          {panel.emoji && <span>{panel.emoji}</span>}
          <Link href={panel.href} className="hover:text-primary-600">{panel.title}</Link>
        </h2>
        <div className="space-y-6">
          {panel.sections.map((s) => (
            <div key={s.id} id={s.id}>
              <h3 className="font-bold text-gray-900 mb-2">{s.heading}</h3>
              <div className="kb-content text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.html }} />
            </div>
          ))}
        </div>
      </section>

      {/* Operaciones */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary-600" />
          Operaciones
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {operations.map((op) => (
            <Link
              key={op.slug}
              href={op.href}
              className={`flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-200 hover:border-primary-400 hover:shadow-md transition-all ${
                kiosk ? 'p-5' : 'p-4'
              }`}
            >
              <span>
                <span className="block font-semibold text-gray-900">{op.title}</span>
                {(op.when ?? op.summary) && <span className="block text-sm text-gray-500 mt-0.5">{op.when ?? op.summary}</span>}
              </span>
              <ChevronRight className="w-5 h-5 text-primary-600 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {zones.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Zonas</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {zones.map((doc) => <DocCard key={doc.slug} doc={doc} kiosk={kiosk} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Normas y dudas</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {hubs.map((doc) => <DocCard key={doc.slug} doc={doc} kiosk={kiosk} />)}
        </div>
      </section>

      {/* En la tablet el chat va abierto al entrar desde el botón Ayuda; en la web lo monta _app */}
      {kiosk && <ChatWidget defaultOpen guideBasePath={basePath} />}
    </GuideLayout>
  );
}
