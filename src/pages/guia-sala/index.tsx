import Head from 'next/head';
import GuiaSala from '@/components/GuiaSala';

export default function GuiaSalaPage() {
  return (
    <>
      <Head>
        <title>Guía de la sala - HappyHub</title>
        <meta
          name="description"
          content="Cómo usar la sala de HappyHub: panel, luces, aire acondicionado, música por Bluetooth, normas y ayuda durante tu evento."
        />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-32 pb-10">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 animate-fade-in">Guía de la sala</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in">
            Todo lo que necesitas durante tu evento: luces, aire, música y normas.
          </p>
        </div>
      </section>

      <section className="pb-20 bg-white">
        <GuiaSala />
      </section>
    </>
  );
}
