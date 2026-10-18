import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { queryOne } from '@/lib/db';
import { ensureReservationFlowColumns } from '@/lib/reservationFlow';
import { buildReservationCode } from '@/utils/reservationCode';
import { BIZUM_PHONE, formatDueAt, SECURITY_DEPOSIT_AMOUNT, SECURITY_DEPOSIT_ONLINE_HOLD_DAYS } from '@/config/payments';
import { CreditCard, Calendar, Users, AlertCircle, CheckCircle, Smartphone, Clock, Lock } from 'lucide-react';

interface PageProps {
  valid: boolean;
  error?: string;
  /** Todo hecho (resto pagado y fianza bloqueada): se muestra como éxito, no como error */
  done?: boolean;
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
    remainingPaid: boolean;
    depositHeld: boolean;
  };
  token: string;
  justPaid?: 'remaining' | 'security_deposit' | null;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (10:00-14:00)',
  afternoon: 'Tarde (16:00-20:00)',
};

export default function PagarPage({ valid, error, done, reservation, token, justPaid }: PageProps) {
  const [loading, setLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const handlePay = async (step?: 'remaining' | 'security_deposit') => {
    setLoading(true);
    setPayError('');
    try {
      const res = await fetch('/api/payments/remaining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, step }),
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
  const isDayOf = reservation?.kind === 'remaining';

  return (
    <>
      <Head>
        <title>{isDeposit ? 'Pago de la señal' : 'Pago restante'} — HappyHub</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
          {done ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Todo listo!</h1>
              <p className="text-gray-600 mb-4">
                El pago está completo y la fianza de {SECURITY_DEPOSIT_AMOUNT} € está bloqueada en tu tarjeta. ¡Disfrutad del evento!
              </p>
              <p className="text-sm text-gray-500">
                Liberaremos la fianza en cuanto revisemos el espacio (como máximo en {SECURITY_DEPOSIT_ONLINE_HOLD_DAYS} días).
              </p>
            </div>
          ) : !valid ? (
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
                    se cancelará y la fecha quedará libre.
                  </span>
                </div>
              )}

              {isDayOf ? (
                <DayOfSteps reservation={reservation} loading={loading} payError={payError} justPaid={justPaid || null} onPay={handlePay} />
              ) : (
              <>
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
                onClick={() => handlePay()}
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
              </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function DayOfSteps({
  reservation,
  loading,
  payError,
  justPaid,
  onPay,
}: {
  reservation: NonNullable<PageProps['reservation']>;
  loading: boolean;
  payError: string;
  justPaid: 'remaining' | 'security_deposit' | null;
  onPay: (step: 'remaining' | 'security_deposit') => void;
}) {
  const step = !reservation.remainingPaid ? 1 : 2;
  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        Antes de empezar el evento hay que hacer <strong>dos pasos</strong> con tarjeta (crédito o débito). Bizum no está
        disponible para estos pagos.
      </p>

      {justPaid === 'remaining' && (
        <div className="bg-green-50 text-green-800 rounded-lg p-3 text-sm mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Pago del resto recibido. Falta el paso 2.
        </div>
      )}

      <div className={`border rounded-xl p-4 mb-4 ${step === 1 ? 'border-primary-300 bg-primary-50/40' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-gray-900">1. Pagar el resto</span>
          {reservation.remainingPaid ? (
            <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Pagado</span>
          ) : (
            <span className="font-bold text-gray-900">{reservation.amountDue.toFixed(2)} €</span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Total {reservation.totalPrice.toFixed(2)} € − señal ya pagada {reservation.depositPaid.toFixed(2)} €.
        </p>
        {!reservation.remainingPaid && (
          <button
            onClick={() => onPay('remaining')}
            disabled={loading}
            className="mt-3 w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50"
          >
            <CreditCard className="w-5 h-5" />
            {loading ? 'Redirigiendo...' : `Pagar ${reservation.amountDue.toFixed(2)} €`}
          </button>
        )}
      </div>

      <div className={`border rounded-xl p-4 mb-4 ${step === 2 ? 'border-primary-300 bg-primary-50/40' : 'border-gray-200 opacity-70'}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-gray-900">2. Bloquear la fianza</span>
          <span className="font-bold text-gray-900">{SECURITY_DEPOSIT_AMOUNT} €</span>
        </div>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li><strong>No es un cobro:</strong> el importe queda retenido en tu tarjeta.</li>
          <li>Lo liberamos en cuanto revisamos el espacio, como máximo en {SECURITY_DEPOSIT_ONLINE_HOLD_DAYS} días.</li>
          <li>Solo se cobraría si hay daños, con fotos y aviso previo.</li>
          <li>Con tarjeta de débito, los {SECURITY_DEPOSIT_AMOUNT} € se retienen de tu saldo hasta la liberación (tu banco puede tardar unos días en reflejarla).</li>
        </ul>
        {step === 2 && (
          <button
            onClick={() => onPay('security_deposit')}
            disabled={loading}
            className="mt-3 w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50"
          >
            <Lock className="w-5 h-5" />
            {loading ? 'Redirigiendo...' : `Bloquear ${SECURITY_DEPOSIT_AMOUNT} € de fianza`}
          </button>
        )}
      </div>

      {payError && <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">{payError}</div>}

      <p className="text-center text-xs text-gray-400">
        Pago seguro procesado por Stripe. Sin pago del resto y bloqueo de la fianza no puede comenzar el evento.
      </p>
    </div>
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
  const okParam = context.query.ok;
  const justPaid = okParam === 'remaining' || okParam === 'security_deposit' ? okParam : null;

  try {
    await ensureReservationFlowColumns();
    const paymentToken = await queryOne(
      `SELECT pt.reservation_id, pt.used, pt.expires_at, pt.token_type,
              r.id, TO_CHAR(r.event_date, 'YYYY-MM-DD') AS event_date, r.time_slot, r.event_type, r.guests,
              r.total_price, r.deposit_paid, r.deposit_amount, r.payment_status, r.status,
              r.payment_method, r.payment_due_at, r.security_deposit_status,
              u.name as customer_name
       FROM payment_tokens pt
       JOIN reservations r ON pt.reservation_id::text = r.id::text
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

    const remainingPaid = paymentToken.payment_status === 'fully_paid';
    const depositHeld = paymentToken.security_deposit_status === 'held';
    if (!isDeposit && remainingPaid && (depositHeld || justPaid === 'security_deposit')) {
      // justPaid: el webhook de Stripe puede llegar unos segundos después de volver a la página
      return { props: { valid: true, done: true, token } };
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

    if (paymentToken.status === 'cancelled' || paymentToken.status === 'rejected') {
      return { props: { valid: false, error: 'Esta reserva está cancelada.', token } };
    }

    let customerName = paymentToken.customer_name as string | null;
    if (!customerName) {
      const acceptance = await queryOne<{ customer_name: string }>(
        'SELECT customer_name FROM contract_acceptances WHERE reservation_id = $1 ORDER BY id DESC LIMIT 1',
        [paymentToken.id]
      ).catch(() => null);
      customerName = acceptance?.customer_name || null;
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
          customerName: customerName || 'Cliente',
          paymentMethod: paymentToken.payment_method || null,
          dueAt: paymentToken.payment_due_at ? new Date(paymentToken.payment_due_at).toISOString() : null,
          // justPaid=remaining: el webhook puede tardar unos segundos; se muestra ya el paso 2
          remainingPaid: remainingPaid || justPaid === 'remaining',
          depositHeld,
        },
        justPaid,
      },
    };
  } catch (error) {
    console.error('Error loading payment token page:', error);
    return { props: { valid: false, error: 'Error del servidor', token } };
  }
};
