import { useCallback, useEffect, useState } from 'react';
import { X, Copy, Check, Ban, Send } from 'lucide-react';
import { CHARGE_CONCEPTS, CHARGE_CONCEPT_LABELS, suggestedExtensionAmount, type ChargeConcept } from '@/utils/charges';
import { MAX_EXTRA_HOURS } from '@/utils/pricing';
import { formatDueAt } from '@/config/payments';

interface Charge {
  id: number;
  label: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  url: string;
  expiresAt: string;
  paidMethod: string | null;
  createdAt: string;
  paidAt: string | null;
}

interface CatalogService {
  id: string;
  title: string;
  price: number;
}

interface Props {
  reservationId: number;
  title: string;
  onClose: () => void;
  notify: (message: string, type: 'success' | 'error') => void;
}

const STATUS_STYLES: Record<Charge['status'], { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800' },
  paid: { label: 'Pagado', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Anulado', className: 'bg-gray-100 text-gray-600' },
};

const PAID_METHOD_LABELS: Record<string, string> = { card: 'tarjeta', bizum: 'Bizum', cash: 'efectivo', transfer: 'transferencia', manual: 'manual' };

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent';

/** Cobros adicionales de una reserva: crear y enviar enlaces de pago, ver su estado, anular o marcar pagados */
export default function ReservationChargesModal({ reservationId, title, onClose, notify }: Props) {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [concept, setConcept] = useState<ChargeConcept>('extension');
  const [hours, setHours] = useState(1);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(String(suggestedExtensionAmount(1)));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadCharges = useCallback(() => {
    fetch(`/api/admin/reservations/${reservationId}/charges`)
      .then((r) => r.json())
      .then((d) => d.success && setCharges(d.charges))
      .catch((err) => console.warn('Failed to load charges:', err));
  }, [reservationId]);

  useEffect(() => {
    loadCharges();
    fetch('/api/services-catalog')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.services) setCatalog(d.services.map((s: any) => ({ id: String(s.id), title: s.title, price: parseFloat(s.price) || 0 })));
      })
      .catch((err) => console.warn('Failed to load services catalog:', err));
  }, [loadCharges]);

  const selectConcept = (next: ChargeConcept) => {
    setConcept(next);
    setError('');
    if (next === 'extension') setAmount(String(suggestedExtensionAmount(hours)));
    else if (next === 'services') applyServices(serviceIds);
    else {
      setAmount('');
      setDescription('');
    }
  };

  const selectHours = (h: number) => {
    setHours(h);
    setAmount(String(suggestedExtensionAmount(h)));
  };

  // Servicios: importe sugerido = suma del catálogo; la descripción lista los servicios
  const applyServices = (ids: string[]) => {
    const selected = catalog.filter((s) => ids.includes(s.id));
    setServiceIds(ids);
    setAmount(selected.length > 0 ? String(selected.reduce((sum, s) => sum + s.price, 0)) : '');
    setDescription(selected.map((s) => s.title).join(', '));
  };

  const toggleService = (id: string) =>
    applyServices(serviceIds.includes(id) ? serviceIds.filter((x) => x !== id) : [...serviceIds, id]);

  const handleCreate = async () => {
    setError('');
    if (concept === 'services' && !description.trim()) return setError('Elige al menos un servicio o describe el concepto');
    if (concept === 'other' && !description.trim()) return setError('Describe el concepto del cobro');
    if (!(parseFloat(amount) > 0)) return setError('Indica un importe mayor que 0');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, hours: concept === 'extension' ? hours : null, description, amount: parseFloat(amount) }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Error al crear el cobro');
      if (data.emailWarning) notify(data.emailWarning, 'error');
      else notify('Enlace de pago enviado al cliente', 'success');
      setDescription('');
      setServiceIds([]);
      setAmount(concept === 'extension' ? String(suggestedExtensionAmount(hours)) : '');
      loadCharges();
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const updateCharge = async (chargeId: number, action: 'cancel' | 'mark_paid', method?: string) => {
    const question = action === 'cancel' ? '¿Anular este cobro? El enlace dejará de funcionar.' : `¿Marcar este cobro como pagado (${PAID_METHOD_LABELS[method || 'manual']})?`;
    if (!window.confirm(question)) return;
    const res = await fetch(`/api/admin/reservations/${reservationId}/charges`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chargeId, action, method }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return notify(data.error || 'Error al actualizar el cobro', 'error');
    setCharges(data.charges);
    notify(action === 'cancel' ? 'Cobro anulado' : 'Cobro marcado como pagado', 'success');
  };

  const copyLink = async (charge: Charge) => {
    try {
      await navigator.clipboard.writeText(charge.url);
      setCopiedId(charge.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt('Copia el enlace de pago:', charge.url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Cobros adicionales · {title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {charges.length > 0 && (
          <div className="space-y-2 mb-6">
            {charges.map((c) => (
              <div key={c.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-gray-900">{c.label}</div>
                    <div className="text-xs text-gray-500">
                      {c.status === 'paid' && c.paidAt
                        ? `Pagado el ${formatDueAt(c.paidAt)}${c.paidMethod ? ` (${PAID_METHOD_LABELS[c.paidMethod] || c.paidMethod})` : ''}`
                        : c.status === 'pending'
                          ? `Enviado el ${formatDueAt(c.createdAt)} · válido hasta el ${formatDueAt(c.expiresAt)}`
                          : `Creado el ${formatDueAt(c.createdAt)}`}
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{c.amount} €</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[c.status].className}`}>{STATUS_STYLES[c.status].label}</span>
                  </div>
                </div>
                {c.status === 'pending' && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button onClick={() => copyLink(c)} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">
                      {copiedId === c.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedId === c.id ? 'Copiado' : 'Copiar enlace'}
                    </button>
                    <button onClick={() => updateCharge(c.id, 'mark_paid', 'bizum')} className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded">Pagado por Bizum</button>
                    <button onClick={() => updateCharge(c.id, 'mark_paid', 'cash')} className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded">Pagado en efectivo</button>
                    <button onClick={() => updateCharge(c.id, 'cancel')} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded">
                      <Ban className="w-3 h-3" /> Anular
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <h4 className="text-sm font-semibold text-gray-800 mb-3">Nuevo enlace de pago</h4>
        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-3">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
            <div className="grid grid-cols-2 gap-2">
              {CHARGE_CONCEPTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => selectConcept(c)}
                  className={`px-2 py-2 rounded-lg border text-sm transition-colors ${concept === c ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {CHARGE_CONCEPT_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {concept === 'extension' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horas</label>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: MAX_EXTRA_HOURS }, (_, i) => i + 1).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => selectHours(h)}
                    className={`px-2 py-2 rounded-lg border text-sm transition-colors ${hours === h ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {h} h · {suggestedExtensionAmount(h)} €
                  </button>
                ))}
              </div>
            </div>
          )}

          {concept === 'services' && catalog.length > 0 && (
            <div className="space-y-2">
              {catalog.map((s) => (
                <label key={s.id} className="flex items-center justify-between gap-2 text-sm text-gray-700 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={serviceIds.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    {s.title}
                  </span>
                  <span className="text-gray-500 whitespace-nowrap">{s.price} €</span>
                </label>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {concept === 'other' ? 'Descripción *' : 'Descripción (opcional)'}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder={concept === 'other' ? 'Ej.: Limpieza extra' : 'Se muestra al cliente junto al concepto'}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importe (EUR)</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputClass} />
          </div>

          <p className="text-xs text-gray-500">
            Se envía al email de la reserva con un enlace para pagar con tarjeta. No cambia el precio total ni el resto del día del evento.
          </p>

          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {saving ? 'Enviando...' : 'Crear y enviar enlace de pago'}
          </button>
        </div>
      </div>
    </div>
  );
}
