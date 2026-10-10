import Head from 'next/head';
import Link from 'next/link';
import TermsContent, { TERMS_LAST_UPDATED } from '@/components/TermsContent';

export default function Terminos() {
  return (
    <>
      <Head>
        <title>Términos y Condiciones - HappyHub</title>
        <meta name="description" content="Términos y condiciones de uso del servicio de alquiler de espacios para eventos de HappyHub." />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 pt-28 pb-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Última actualización: {TERMS_LAST_UPDATED}
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
            <TermsContent />
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Tienes alguna duda?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Si tienes preguntas sobre nuestros términos, no dudes en contactarnos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contacto" className="btn-primary">
              Contactar
            </Link>
            <Link href="/" className="btn-outline">
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
