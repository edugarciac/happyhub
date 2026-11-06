import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, CheckCircle, Lock, Unlock, Euro, QrCode, Mail } from 'lucide-react';
import { SECURITY_DEPOSIT_AMOUNT, formatDueAt } from '@/config/payments';
import { REMAINING_PAYMENT_METHOD_LABELS } from '@/utils/reservationStatus';

export interface DayOfReservation {
  id: number;
  name: string;
  totalPrice: number;
  depositPaid: number;
  paymentStatus: string;
  remainingPaymentMethod: string | null;
  securityDepositStatus: string;
  securityDepositMethod: string | null;
  securityDepositAmountHeld: number | null;
  securityDepositExpiresAt: string | null;
  securityDepositCaptured: number | null;
}

const DEPOSIT_LABELS: Record<string, string> = {
  none: 'Sin bloquear',
  held: 'Bloqueada',
  released: 'Liberada',
  captured: 'Cobrada (daños)',
  expired: 'Caducada sin cobrar',
};

/** Cobro del día del evento: enlace/QR/email de Stripe (resto + fianza) y gestión de la fianza. */
export default function DayOfPaymentModal({
  reservation: r,
  onClose,
  onChanged,
}: {
  reservation: DayOfReservation;
  onClose: () => void;
  onChanged: (message: string, type: 'success' | 'error') => void;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [emailedTo, setEmailedTo] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [captureAmount, setCaptureAmount] = useState('');
  const [captureNote, setCaptureNote] = useState('');

  const remaining = Math.max(0, r.totalPrice - r.depositPaid);
  const remainingPaid = r.paymentStatus === 'fully_paid';
  const depositHeld = r.securityDepositStatus === 'held';
  const held = r.securityDepositAmountHeld || SECURITY_DEPOSIT_AMOUNT;

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link, { width: 260, margin: 1 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [link]);

  const call = async (url: string, body?: object) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error');
        return null;
      }
      return data;
    } catch {
      setError('Error de conexión');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const generateLink = async () => {
    const data = await call(`/api/admin/reservations/${r.id}/payment-link`);
    if (data?.url) setLink(data.url);
  };

  // Mismo enlace que el QR, enviado además al email de la reserva
  const emailLink = async () => {
    if (!confirm('¿Enviar el enlace de pago al email de la reserva?')) return;
    const data = await call(`/api/admin/reservations/${r.id}/payment-link`, { sendEmail: true });
    if (data?.url) {
      setLink(data.url);
      setEmailedTo(data.emailSentTo || null);
    }
  };

  const deposit = async (action: 'release' | 'capture') => {
    if (action === 'release' && !confirm('¿Liberar la fianza? Esta acción no se puede deshacer.')) return;
    if (action === 'capture' && !confirm(`¿Cobrar ${captureAmount} € de la fianza por daños? El resto se libera.`)) return;
    const data = await call(`/api/admin/reservations/${r.id}/security-deposit`, {
      action,
      amount: action === 'capture' ? Number(captureAmount.replace(',', '.')) : undefined,
      note: action === 'capture' ? captureNote : undefined,
    });
    if (data) onChanged(data.message || 'Fianza actualizada', 'success');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Cobro del día — {r.name || `Reserva #${r.id}`}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Estado */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
          <div className="border rounded-lg p-3">
            <p className="text-gray-500">Resto</p>
            <p className="font-semibold">
              {remainingPaid
                ? `Pagado${r.remainingPaymentMethod && REMAINING_PAYMENT_METHOD_LABELS[r.remainingPaymentMethod] ? ` (${REMAINING_PAYMENT_METHOD_LABELS[r.remainingPaymentMethod]})` : ''}`
                : `${remaining.toFixed(2)} € pendiente`}
            </p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-gray-500">Fianza {SECURITY_DEPOSIT_AMOUNT} €</p>
            <p className="font-semibold">
              {DEPOSIT_LABELS[r.securityDepositStatus] || r.securityDepositStatus}
              {r.securityDepositStatus === 'captured' && r.securityDepositCaptured ? ` ${r.securityDepositCaptured} €` : ''}
              {depositHeld && r.securityDepositMethod === 'terminal' ? ' (datáfono)' : ''}
            </p>
            {depositHeld && r.securityDepositExpiresAt && (
              <p className="text-xs text-amber-700 mt-1">Caduca: {formatDueAt(r.securityDepositExpiresAt)}</p>
            )}
          </div>
        </div>

        {/* Opción preferente: enlace / QR */}
        {(!remainingPaid || r.securityDepositStatus === 'none') && (
          <div className="border border-primary-200 bg-primary-50/40 rounded-xl p-4 mb-4">
            <p className="font-semibold text-gray-900 flex items-center gap-2 mb-1"><QrCode className="w-4 h-4" /> Enlace, QR o email</p>
            <p className="text-xs text-gray-600 mb-3">
              El cliente paga el resto y bloquea la fianza desde su móvil. El bloqueo dura hasta 7 días.
            </p>
            {emailedTo && (
              <p className="text-xs text-green-700 bg-green-50 rounded-lg p-2 mb-3 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Enlace enviado a {emailedTo}
              </p>
            )}
            {!link ? (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={generateLink} disabled={busy} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-1">
                  <QrCode className="w-4 h-4" /> Enseñar QR
                </button>
                <button onClick={emailLink} disabled={busy} className="px-4 py-2 border border-primary-600 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-50 disabled:opacity-50 flex items-center justify-center gap-1">
                  <Mail className="w-4 h-4" /> Enviar por email
                </button>
              </div>
            ) : (
              <div className="text-center">
                {qr && <img src={qr} alt="QR de pago" className="mx-auto mb-3 w-56 h-56" />}
                <div className="flex items-center gap-2 bg-white border rounded-lg p-2">
                  <span className="text-xs text-gray-700 flex-1 break-all font-mono text-left">{link}</span>
                  <button onClick={() => navigator.clipboard.writeText(link)} className="shrink-0 px-3 py-1 bg-primary-600 text-white text-xs rounded-lg">Copiar</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Válido 72 horas. Al terminar, refresca la lista para ver el estado.</p>
                {!emailedTo && (
                  <button onClick={emailLink} disabled={busy} className="mt-2 text-xs text-primary-700 hover:underline inline-flex items-center gap-1 disabled:opacity-50">
                    <Mail className="w-3 h-3" /> Enviar también por email
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Después del evento */}
        {depositHeld && (
          <div className="border rounded-xl p-4 mb-4">
            <p className="font-semibold text-gray-900 mb-3">Después del evento</p>
            <button onClick={() => deposit('release')} disabled={busy} className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              <Unlock className="w-4 h-4" /> Todo correcto: liberar fianza
            </button>
            <details>
              <summary className="text-sm text-red-700 cursor-pointer">Hay daños: cobrar parte o toda la fianza</summary>
              <div className="mt-3 space-y-2">
                <input
                  type="number" min="0.01" max={held} step="0.01" value={captureAmount}
                  onChange={(e) => setCaptureAmount(e.target.value)}
                  placeholder={`Importe (máx. ${held} €)`}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <textarea
                  value={captureNote} onChange={(e) => setCaptureNote(e.target.value)} rows={3}
                  placeholder="Describe los daños (obligatorio). Guarda las fotos y envíalas al cliente."
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <button onClick={() => deposit('capture')} disabled={busy || !captureAmount || captureNote.trim().length < 5} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  <Euro className="w-4 h-4" /> Cobrar daños
                </button>
              </div>
            </details>
          </div>
        )}

        {remainingPaid && depositHeld && (
          <p className="text-sm text-green-700 flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4" /> <Lock className="w-4 h-4" /> Listo para empezar el evento.</p>
        )}
        {!(remainingPaid && depositHeld) && r.securityDepositStatus !== 'released' && r.securityDepositStatus !== 'captured' && (
          <p className="text-xs text-gray-500 mb-2">Sin el resto pagado y la fianza bloqueada, el evento no debe empezar (condiciones, apartado 4).</p>
        )}

        {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
      </div>
    </div>
  );
}
