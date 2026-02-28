import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { CheckCircle, Calendar, Mail, Phone, Download, Home, Loader2 } from 'lucide-react';

interface ReservationDetails {
  reservationId: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  guests: number;
  totalPrice: number;
  depositAmount: number;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (11:00-14:30)',
  afternoon: 'Tarde (16:30-20:30)',
  night: 'Noche (22:00-02:00)',
};

export default function BookingSuccess() {
  const router = useRouter();
  const { session_id, reservation_id } = router.query;
  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservationDetails = async () => {
      if (!session_id) return;

      try {
        const response = await fetch(`/api/reservation-details?session_id=${session_id}`);
        if (response.ok) {
          const data = await response.json();
          setReservation(data);
        } else {
          // If API fails, use reservation_id from URL
          setReservation({
            reservationId: reservation_id as string || 'N/A',
            name: '',
            email: '',
            phone: '',
            date: '',
            timeSlot: '',
            guests: 0,
            totalPrice: 0,
            depositAmount: 0,
          });
        }
      } catch (err) {
        console.error('Error fetching reservation details:', err);
        setReservation({
          reservationId: reservation_id as string || 'N/A',
          name: '',
          email: '',
          phone: '',
          date: '',
          timeSlot: '',
          guests: 0,
          totalPrice: 0,
          depositAmount: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchReservationDetails();
    }
  }, [router.isReady, session_id, reservation_id]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Confirmando tu reserva...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Reserva Confirmada - HappyHub</title>
        <meta name="description" content="Tu reserva en HappyHub ha sido confirmada" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-green-50 to-primary-50 pt-24 pb-16 px-4">
        <div className="container-custom max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Success icon */}
            <div className="mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Reserva Confirmada!
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Tu pago ha sido procesado correctamente
            </p>

            {/* Reservation ID */}
            <div className="bg-primary-50 rounded-xl p-6 mb-8">
              <p className="text-sm text-gray-600 mb-2">Número de reserva</p>
              <p className="text-3xl font-bold text-primary-600">
                {reservation?.reservationId || reservation_id}
              </p>
            </div>

            {/* Reservation details */}
            {reservation?.date && (
              <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                <h2 className="font-bold text-gray-900 mb-4">Detalles de tu reserva</h2>

                <div className="space-y-3">
                  {reservation.date && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{formatDate(reservation.date)}</p>
                        <p className="text-sm text-gray-600">
                          {TIME_SLOT_LABELS[reservation.timeSlot] || reservation.timeSlot}
                        </p>
                      </div>
                    </div>
                  )}

                  {reservation.guests > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg">👥</span>
                      <p className="text-gray-700">{reservation.guests} invitados</p>
                    </div>
                  )}

                  {reservation.depositAmount > 0 && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-gray-600">Señal pagada:</span>
                      <span className="font-bold text-green-600">{reservation.depositAmount}€</span>
                    </div>
                  )}

                  {reservation.totalPrice > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Resto pendiente:</span>
                      <span className="font-bold text-gray-900">
                        {reservation.totalPrice - reservation.depositAmount}€
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-bold text-blue-900 mb-4">¿Qué sigue ahora?</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Email de confirmación</p>
                    <p className="text-sm text-blue-700">
                      Recibirás un email con todos los detalles y el contrato
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">WhatsApp de confirmación</p>
                    <p className="text-sm text-blue-700">
                      También te enviaremos confirmación por WhatsApp
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Recordatorio</p>
                    <p className="text-sm text-blue-700">
                      7 días antes de tu evento te recordaremos los detalles
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/mi-reserva/${reservation?.reservationId || reservation_id}`}
                className="btn-primary flex items-center justify-center gap-2 flex-1"
              >
                <Calendar className="w-5 h-5" />
                Ver mi reserva
              </Link>
              <Link
                href="/"
                className="btn-outline flex items-center justify-center gap-2 flex-1"
              >
                <Home className="w-5 h-5" />
                Volver al inicio
              </Link>
            </div>

            {/* Download contract */}
            {reservation?.reservationId && (
              <div className="mt-6">
                <a
                  href={`/api/contracts/${reservation.reservationId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Descargar contrato PDF
                </a>
              </div>
            )}

            {/* Contact */}
            <p className="text-sm text-gray-600 mt-8">
              ¿Tienes preguntas?{' '}
              <Link href="/contacto" className="text-primary-600 hover:underline">
                Contáctanos
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
