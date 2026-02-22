import Head from 'next/head';
import BookingWizard from '@/components/booking/BookingWizard';

export default function Reservas() {
  return (
    <>
      <Head>
        <title>Reservar - HappyHub</title>
        <meta name="description" content="Completa tu reserva para tu celebración en HappyHub" />
      </Head>

      <BookingWizard />
    </>
  );
}
