import Head from 'next/head';
import GuiaSala from '@/components/GuiaSala';

/** Versión para el panel de la tablet de la sala (incrustada en Home Assistant). Sin cabecera ni pie. */
export default function GuiaSalaPanelPage() {
  return (
    <>
      <Head>
        <title>Guía de la sala - HappyHub</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-white">
        <GuiaSala embedded />
      </div>
    </>
  );
}
