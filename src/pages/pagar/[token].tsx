import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { queryOne } from '@/lib/db';
import { ensureReservationFlowColumns } from '@/lib/reservationFlow';
import { buildReservationCode } from '@/utils/reservationCode';
import { BIZUM_PHONE, formatDueAt } from '@/config/payments';
import { CreditCard, Calendar, Users, AlertCircle, CheckCircle, Smartphone, Clock } from 'lucide-react';

interface PageProps {
  valid: boolean;
  error?: string;
  reservation?: {
    id: number;
    code: string;
    kind: 'deposit' | 'remaining';
    eventDate: string;
    timeSlot: string;
    eventType: string;
    guests: number;
    totalPrice: number;
    depositPaid: number;
    amountDue: number;
    customerName: string;
    paymentMethod: string | null;
    dueAt: string | null;
  };
  token: string;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (10:00-14:00)',
  afternoon: 'Tarde (16:00-20:00)',
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

  const isDeposit = reservation?.kind === 'deposit';

  return (
    <>
      <Head>
        <title>{isDeposit ? 'Pago de la señal' : 'Pago restante'} — HappyHub</title>
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
                <h1 className="text-2xl font-bold text-gray-900">
                  {isDeposit ? 'Paga la señal de tu reserva' : 'Completa tu pago'}
                </h1>
                <p className="text-gray-600 mt-1">Hola, {reservation.customerName}</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{reservation.code}</p>
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

              {isDeposit && reservation.dueAt && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-900">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Tienes hasta el <strong>{formatDueAt(reservation.dueAt)}</strong> para pagar la señal. Si no, la reserva
                    se cancelará automáticamente.
                  </span>
                </div>
              )}

              {/* Payment breakdown */}
              <div className="border border-gray-200 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Total del evento</span>
                  <span>{reservation.totalPrice.toFixed(2)} €</span>
                </div>
                {!isDeposit && (
                  <div className="flex justify-between text-sm text-green-600 mb-3">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Paga y señal abonada
                    </span>
                    <span>−{reservation.depositPaid.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-100 pt-3">
                  <span>{isDeposit ? 'Señal (30%)' : 'Restante a pagar'}</span>
                  <span>{reservation.amountDue.toFixed(2)} €</span>
                </div>
              </div>

              {payError && (
                <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">
                  {payError}
                </div>
              )}

              {isDeposit && reservation.paymentMethod === 'bizum' && (
                <BizumBox amount={reservation.amountDue} code={reservation.code} />
              )}

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5" />
                {loading ? 'Redirigiendo...' : `Pagar ${reservation.amountDue.toFixed(2)} € con tarjeta`}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Pago seguro procesado por Stripe
              </p>

              {isDeposit && reservation.paymentMethod !== 'bizum' && (
                <div className="mt-6">
                  <BizumBox amount={reservation.amountDue} code={reservation.code} title="¿Prefieres Bizum?" />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function BizumBox({ amount, code, title = 'Pagar por Bizum' }: { amount: number; code: string; title?: string }) {
  return (
    <div className="border border-sky-200 bg-sky-50 rounded-xl p-4 mb-4 text-sm text-sky-900">
      <p className="flex items-center gap-2 font-semibold mb-2">
        <Smartphone className="w-4 h-4" /> {title}
      </p>
      <p>
        Envía <strong>{amount.toFixed(2)} €</strong> al <strong>{BIZUM_PHONE}</strong> con el concepto{' '}
        <strong className="font-mono">{code}</strong>.
      </p>
      <p className="text-xs text-sky-700 mt-2">Confirmaremos tu reserva en cuanto recibamos el Bizum.</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { token } = context.params as { token: string };

  try {
    await ensureReservationFlowColumns();
    const paymentToken = await queryOne(
      `SELECT pt.reservation_id, pt.used, pt.expires_at, pt.token_type,
              r.id, TO_CHAR(r.event_date, 'YYYY-MM-DD') AS event_date, r.time_slot, r.event_type, r.guests,
              r.total_price, r.deposit_paid, r.deposit_amount, r.payment_status, r.status,
              r.payment_method, r.payment_due_at,
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

    const isDeposit = paymentToken.token_type === 'deposit';

    if (isDeposit && (paymentToken.payment_status === 'deposit_paid' || paymentToken.payment_status === 'fully_paid')) {
      return { props: { valid: false, error: 'La señal de esta reserva ya está pagada. ¡Gracias!', token } };
    }

    if (paymentToken.used) {
      return { props: { valid: false, error: 'Este enlace ya fue utilizado', token } };
    }

    if (isDeposit && paymentToken.status !== 'approved') {
      return {
        props: { valid: false, error: 'Esta reserva ya no está pendiente de pago (cancelada o plazo vencido).', token },
      };
    }

    if (new Date(paymentToken.expires_at) < new Date()) {
      return { props: { valid: false, error: 'Este enlace de pago ha caducado.', token } };
    }

    if (paymentToken.payment_status === 'fully_paid') {
      return { props: { valid: false, error: 'Esta reserva ya está totalmente pagada', token } };
    }

    const totalPrice = parseFloat(paymentToken.total_price || '0');
    const depositPaid = parseFloat(paymentToken.deposit_paid || '0');
    const depositAmount = parseFloat(paymentToken.deposit_amount || '0');

    return {
      props: {
        valid: true,
        token,
        reservation: {
          id: paymentToken.id,
          code: buildReservationCode(paymentToken.event_date, paymentToken.id),
          kind: isDeposit ? 'deposit' : 'remaining',
          eventDate: `${paymentToken.event_date}T12:00:00`,
          timeSlot: paymentToken.time_slot,
          eventType: paymentToken.event_type || '',
          guests: paymentToken.guests || 0,
          totalPrice,
          depositPaid,
          amountDue: isDeposit ? depositAmount : totalPrice - depositPaid,
          customerName: paymentToken.customer_name || 'Cliente',
          paymentMethod: paymentToken.payment_method || null,
          dueAt: paymentToken.payment_due_at ? new Date(paymentToken.payment_due_at).toISOString() : null,
        },
      },
    };
  } catch (error) {
    console.error('Error loading payment token page:', error);
    return { props: { valid: false, error: 'Error del servidor', token } };
  }
};
