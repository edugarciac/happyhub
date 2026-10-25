import Head from 'next/head';
import PricingTable from '@/components/PricingTable';

export default function Precios() {
  return (
    <>
      <Head>
        <title>Precios - HappyHub</title>
        <meta name="description" content="Tarifas de alquiler de HappyHub según día y franja horaria" />
      </Head>

      <div className="pt-16">
        <PricingTable />
      </div>
    </>
  );
}
