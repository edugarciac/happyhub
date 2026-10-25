import { useMemo, useState } from 'react';
import { ChevronDown, MessageCircle, Phone, Search, X } from 'lucide-react';
import { CONTACT_INFO } from '@/config/contact';
import { GUIA_SALA_CATEGORIES, filterGuia } from '@/data/guiaSala';

interface GuiaSalaProps {
  /** true en /guia-sala/panel: letra más grande y sin márgenes de página, para la tablet */
  embedded?: boolean;
}

export default function GuiaSala({ embedded = false }: GuiaSalaProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const results = useMemo(() => filterGuia(GUIA_SALA_CATEGORIES, query, category), [query, category]);
  const searching = query.trim().length > 0;
  const total = results.reduce((n, c) => n + c.faqs.length, 0);

  const toggleItem = (key: string) => setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const chipClass = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-2 font-medium transition-colors ${
      embedded ? 'text-base' : 'text-sm'
    } ${
      active
        ? 'border-primary-600 bg-primary-600 text-white'
        : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
    }`;

  return (
    <div className={embedded ? 'mx-auto max-w-4xl px-4 py-4' : 'container-custom max-w-3xl'}>
      {/* Buscador */}
      <div className={`sticky z-10 bg-white pb-3 ${embedded ? 'top-0 pt-1' : 'top-[72px] pt-4'}`}>
        <label htmlFor="guia-search" className="sr-only">
          Buscar en la guía
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            id="guia-search"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca: música, bluetooth, aire, luces…"
            autoComplete="off"
            className={`w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 ${
              embedded ? 'py-4 text-lg' : 'py-3 text-base'
            }`}
          />
          {searching && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Borrar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Categorías */}
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          <button type="button" onClick={() => setCategory(null)} className={chipClass(category === null)}>
            Todo
          </button>
          {GUIA_SALA_CATEGORIES.map((c) => (
            <button
              key={c.title}
              type="button"
              onClick={() => setCategory(category === c.title ? null : c.title)}
              className={chipClass(category === c.title)}
            >
              {c.emoji} {c.title}
            </button>
          ))}
        </div>

        {searching && (
          <p className="mt-2 text-sm text-gray-500">
            {total === 1 ? '1 resultado' : `${total} resultados`}
          </p>
        )}
      </div>

      {/* Resultados */}
      {results.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
          <p className={`font-semibold text-gray-900 ${embedded ? 'text-lg' : ''}`}>
            No encontramos nada con «{query}».
          </p>
          <p className="mt-2 text-gray-600">Prueba con otra palabra o escríbenos:</p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={`tel:${CONTACT_INFO.phoneInternational}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700"
            >
              <Phone className="h-5 w-5" /> {CONTACT_INFO.phoneFormatted}
            </a>
            <a
              href={CONTACT_INFO.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-600 px-5 py-3 font-semibold text-primary-700 hover:bg-primary-50"
            >
              <MessageCircle className="h-5 w-5" /> WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <div className={`space-y-10 ${embedded ? 'mt-4' : 'mt-8'}`}>
          {results.map((c) => (
            <section key={c.title}>
              <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-gray-900">
                <span className="text-3xl">{c.emoji}</span>
                {c.title}
              </h2>
              <div className="space-y-3">
                {c.faqs.map((faq) => {
                  const key = `${c.title}-${faq.question}`;
                  const isOpen = searching || !!openItems[key];
                  return (
                    <div key={key} className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                      <button
                        type="button"
                        onClick={() => toggleItem(key)}
                        aria-expanded={isOpen}
                        className={`flex w-full items-center justify-between px-6 text-left font-semibold text-gray-900 transition-colors hover:bg-gray-100 ${
                          embedded ? 'py-5 text-lg' : 'py-4'
                        }`}
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`ml-4 h-5 w-5 flex-shrink-0 text-primary-600 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div
                          className={`border-t border-gray-200 px-6 pb-5 pt-4 leading-relaxed text-gray-600 ${
                            embedded ? 'text-lg' : ''
                          }`}
                        >
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
