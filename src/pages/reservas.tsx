import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { isBookingAllowedEmail } from '@/utils/bookingAccess';

const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function Reservas() {
  const router = useRouter();
  const { date, timeSlot } = router.query;
  const { data: session, status } = useSession();
  const isAllowed = isBookingAllowedEmail(session?.user?.email);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (!isAllowed) {
      router.replace('/reserva-restringida');
      return;
    }
    if (session?.user && !(session.user as any).emailVerified) {
      router.replace('/verificacion-pendiente');
    }
  }, [session, status, isAllowed, router]);

  if (status === 'loading' || status === 'unauthenticated' || !isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
