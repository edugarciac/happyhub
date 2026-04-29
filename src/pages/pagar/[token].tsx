import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { queryOne } from '@/lib/db';
import { CreditCard, Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface PageProps {
  valid: boolean;
  error?: string;
  reservation?: {
    id: number;
    eventDate: string;
    timeSlot: string;
    eventType: string;
    guests: number;
    totalPrice: number;
    depositPaid: number;
    remaining: number;
    customerName: string;
  };
  token: string;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (11:00-14:30)',
  afternoon: 'Tarde (16:30-20:30)',
  night: 'Noche (22:00-02:00)',
};

export default function PagarPage({ valid, error, reservation, token }: PageProps) {
  const [loading, setLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setPayError('');
    try {
      const res = await fetch('/api/payments/remaining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setPayError(data.error || 'Error al iniciar el pago');
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setPayError('No se pudo conectar con el servidor');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Pago restante — HappyHub</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
          {!valid ? (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace no válido</h1>
              <p className="text-gray-600 mb-6">
                {error || 'Este enlace de pago ha caducado o ya ha sido utilizado.'}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Si necesitas ayuda, contacta con nosotros:
              </p>
              <a
                href="https://wa.me/34624645517"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition"
              >
                Contactar por WhatsApp
              </a>
            </div>
          ) : reservation ? (
            <div>
              <div className="text-center mb-6">
                <CreditCard className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-900">Completa tu pago</h1>
                <p className="text-gray-600 mt-1">Hola, {reservation.customerName}</p>
              </div>

              {/* Event summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{new Date(reservation.eventDate).toLocaleDateString('es-ES', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{reservation.guests} invitados · {reservation.eventType}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{TIME_SLOT_LABELS[reservation.timeSlot] || reservation.timeSlot}</span>
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="border border-gray-200 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Total del evento</span>
                  <span>{reservation.totalPrice.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 mb-3">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Paga y señal abonada
                  </span>
                  <span>−{reservation.depositPaid.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-100 pt-3">
                  <span>Restante a pagar</span>
                  <span>{reservation.remaining.toFixed(2)} €</span>
                </div>
              </div>

              {payError && (
                <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">
                  {payError}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5" />
                {loading ? 'Redirigiendo...' : `Pagar ${reservation.remaining.toFixed(2)} € con tarjeta`}
              </button>

              <p className="text-center text-xs text-gray-400 mt-4">
                Pago seguro procesado por Stripe
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { token } = context.params as { token: string };

  try {
    const paymentToken = await queryOne(
      `SELECT pt.reservation_id, pt.used, pt.expires_at,
              r.id, r.event_date, r.time_slot, r.event_type, r.guests,
              r.total_price, r.deposit_paid, r.payment_status,
              u.name as customer_name
       FROM payment_tokens pt
       JOIN reservations r ON pt.reservation_id = r.id
       LEFT JOIN users u ON r.user_id = u.id
       WHERE pt.token = $1`,
      [token]
    );

    if (!paymentToken) {
      return { props: { valid: false, error: 'Enlace no encontrado', token } };
    }

    if (paymentToken.used) {
      return { props: { valid: false, error: 'Este enlace ya fue utilizado', token } };
    }

    if (new Date(paymentToken.expires_at) < new Date()) {
      return { props: { valid: false, error: 'Este enlace ha caducado (72h de validez)', token } };
    }

    if (paymentToken.payment_status === 'fully_paid') {
      return { props: { valid: false, error: 'Esta reserva ya está totalmente pagada', token } };
    }

    const totalPrice = parseFloat(paymentToken.total_price || '0');
    const depositPaid = parseFloat(paymentToken.deposit_paid || '0');

    return {
      props: {
        valid: true,
        token,
        reservation: {
          id: paymentToken.id,
          eventDate: new Date(paymentToken.event_date).toISOString(),
          timeSlot: paymentToken.time_slot,
          eventType: paymentToken.event_type || '',
          guests: paymentToken.guests || 0,
          totalPrice,
          depositPaid,
          remaining: totalPrice - depositPaid,
          customerName: paymentToken.customer_name || 'Cliente',
        },
      },
    };
  } catch (error) {
    console.error('Error loading payment token page:', error);
    return { props: { valid: false, error: 'Error del servidor', token } };
  }
};
