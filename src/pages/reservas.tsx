import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function Reservas() {
  const router = useRouter();
  const { date, timeSlot } = router.query;
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user && !(session.user as any).emailVerified) {
      router.replace('/verificacion-pendiente');
    }
  }, [session, status, router]);

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
