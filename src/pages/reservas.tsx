import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function Reservas() {
  const router = useRouter();
  const { date, timeSlot } = router.query;

  return (
    <>
      <Head>
        <title>Reservar - HappyHub</title>
        <meta name="description" content="Completa tu reserva para tu celebración en HappyHub" />
      </Head>

      <BookingWizard
        preselectedDate={date as string}
        preselectedTimeSlot={timeSlot as 'morning' | 'afternoon' | 'night'}
      />
    </>
  );
}
