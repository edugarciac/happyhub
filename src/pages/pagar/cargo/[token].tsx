import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { queryOne } from '@/lib/db';
import { ensureReservationChargesTable, getChargeReservation } from '@/lib/reservationCharges';
import { buildReservationCode } from '@/utils/reservationCode';
import { chargeConceptLabel } from '@/utils/charges';
import { formatDueAt } from '@/config/payments';
import { CreditCard, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface PageProps {
  state: 'pay' | 'paid' | 'invalid';
  error?: string;
  token: string;
  charge?: {
    code: string;
    customerName: string;
    eventDate: string;
    timeSlot: string;
    concept: string;
    amount: number;
    expiresAt: string;
  };
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (10:00-14:00)',
  afternoon: 'Tarde (16:00-20:00)',
};

export default function PagarCargoPage({ state, error, token, charge }: PageProps) {
  const [loading, setLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setPayError('');
    try {
      const res = await fetch('/api/payments/charge', {
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
        <title>Pago adicional — HappyHub</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
          {state === 'paid' ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago recibido!</h1>
              <p className="text-gray-600">
                {charge ? (
                  <>
                    Hemos recibido el pago de <strong>{charge.concept}</strong> ({charge.amount.toFixed(2)} €) de la reserva{' '}
                    <span className="font-mono">{charge.code}</span>. ¡Gracias!
                  </>
                ) : (
                  'Este cobro ya está pagado. ¡Gracias!'
                )}
              </p>
            </div>
          ) : state === 'invalid' || !charge ? (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace no válido</h1>
              <p className="text-gray-600 mb-6">{error || 'Este enlace de pago ya no es válido.'}</p>
              <p className="text-sm text-gray-500 mb-6">Si necesitas ayuda, contacta con nosotros:</p>
              <a
                href="https://wa.me/34624645517"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition"
              >
                Contactar por WhatsApp
              </a>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <CreditCard className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-900">Pago adicional de tu reserva</h1>
                <p className="text-gray-600 mt-1">Hola, {charge.customerName}</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{charge.code}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    {new Date(charge.eventDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="text-sm text-gray-500">{TIME_SLOT_LABELS[charge.timeSlot] || charge.timeSlot}</div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 mb-6">
                <div className="flex justify-between gap-4 text-sm text-gray-600 mb-3">
                  <span>Concepto</span>
                  <span className="text-right text-gray-900">{charge.concept}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-100 pt-3">
                  <span>Importe</span>
                  <span>{charge.amount.toFixed(2)} €</span>
                </div>
              </div>

              {payError && <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">{payError}</div>}

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5" />
                {loading ? 'Redirigiendo...' : `Pagar ${charge.amount.toFixed(2)} € con tarjeta`}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">Pago seguro procesado por Stripe</p>
              <p className="text-center text-xs text-gray-400 mt-1">Enlace válido hasta el {formatDueAt(charge.expiresAt)}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { token } = context.params as { token: string };
  const justPaid = context.query.ok === '1';

  try {
    await ensureReservationChargesTable();
    const row = await queryOne<{
      reservation_id: number;
      concept: string;
      hours: number | null;
      description: string;
      amount: string;
      status: string;
      expires_at: Date;
    }>('SELECT reservation_id, concept, hours, description, amount, status, expires_at FROM reservation_charges WHERE token = $1', [token]);
    if (!row) return { props: { state: 'invalid', error: 'Enlace no encontrado', token } };

    const reservation = await getChargeReservation(row.reservation_id);
    if (!reservation) return { props: { state: 'invalid', error: 'Reserva no encontrada', token } };

    const charge = {
      code: buildReservationCode(reservation.event_date, reservation.id),
      customerName: reservation.name || 'Cliente',
      eventDate: `${reservation.event_date}T12:00:00`,
      timeSlot: reservation.time_slot,
      concept: chargeConceptLabel(row),
      amount: parseFloat(row.amount),
      expiresAt: new Date(row.expires_at).toISOString(),
    };

    // justPaid: el webhook de Stripe puede llegar unos segundos después de volver a la página
    if (row.status === 'paid' || (justPaid && row.status === 'pending')) return { props: { state: 'paid', token, charge } };
    if (row.status === 'cancelled') return { props: { state: 'invalid', error: 'Este cobro se ha anulado.', token } };
    if (['cancelled', 'rejected'].includes(reservation.status)) {
      return { props: { state: 'invalid', error: 'Esta reserva está cancelada.', token } };
    }
    if (new Date(row.expires_at) < new Date()) return { props: { state: 'invalid', error: 'Este enlace de pago ha caducado.', token } };

    return { props: { state: 'pay', token, charge } };
  } catch (error) {
    console.error('Error loading extra charge page:', error);
    return { props: { state: 'invalid', error: 'Error del servidor', token } };
  }
};
