import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { GetStaticProps } from 'next';
import { getKbDocs, renderKbDoc } from '@/lib/kb';
import type { KbRenderedDoc } from '@/lib/kbTypes';

interface Props {
  categories: KbRenderedDoc[];
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const categories = getKbDocs({ page: 'como-funciona' }).map((doc) => renderKbDoc(doc, '/guia-sala'));
  return { props: { categories } };
};

export default function ComoFunciona({ categories }: Props) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <Head>
        <title>¿Cómo lo hacemos? - HappyHub</title>
        <meta
          name="description"
          content="Todo lo que necesitas saber sobre cómo funciona HappyHub: reservas, pagos, normas y más."
        />
      </Head>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-32 pb-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            ¿Cómo lo hacemos?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in">
            Todo lo que necesitas saber para que tu evento salga perfecto.
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-3xl">
          <div className="space-y-12">
            {categories.map((category) => (
              <div key={category.slug}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="text-3xl">{category.emoji}</span>
                  {category.title}
                </h2>

                <div className="space-y-3">
                  {category.sections.map((faq) => {
                    const key = `${category.slug}-${faq.id}`;
                    const isOpen = !!openItems[key];

                    return (
                      <div
                        key={key}
                        className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100"
                      >
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full flex items-center justify-between text-left px-6 py-4 font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                          aria-expanded={isOpen}
                        >
                          <span>{faq.heading}</span>
                          <ChevronDown
                            className={`w-5 h-5 text-primary-600 flex-shrink-0 ml-4 transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        <div
                          className={`kb-content px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-200 pt-4 ${
                            isOpen ? 'block' : 'hidden'
                          }`}
                          dangerouslySetInnerHTML={{ __html: faq.html }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Tienes más preguntas?
          </h2>
          <p className="text-xl text-primary-50 mb-8 max-w-2xl mx-auto">
            Escríbenos por WhatsApp o por email y te respondemos enseguida
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservas"
              className="bg-white text-primary-600 hover:bg-primary-50 font-semibold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Reserva tu fecha
            </Link>
            <Link
              href="/contacto"
              className="bg-primary-800 text-white hover:bg-primary-900 font-semibold py-4 px-8 rounded-xl transition-all"
            >
              Contactar
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
