// src/components/events/GiftFundCard.tsx
import { useState } from 'react';

interface GiftFund {
  id: number;
  title: string;
  description: string | null;
  goal_amount: number | null;
  current_amount: number;
  payment_link: string | null;
}

interface GiftFundCardProps {
  eventId: number;
  fund: GiftFund | null;
  isOrganizer: boolean;
  onUpdated: (fund: GiftFund | null) => void;
}

interface FundForm {
  title: string;
  description: string;
  goal_amount: string;
  current_amount: string;
  payment_link: string;
}

export default function GiftFundCard({ eventId, fund, isOrganizer, onUpdated }: GiftFundCardProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FundForm>({
    title: fund?.title || '',
    description: fund?.description || '',
    goal_amount: fund?.goal_amount?.toString() || '',
    current_amount: fund?.current_amount?.toString() || '0',
    payment_link: fund?.payment_link || '',
  });

  const progressPct = fund?.goal_amount && fund.goal_amount > 0
    ? Math.min(100, Math.round((fund.current_amount / fund.goal_amount) * 100))
    : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/regalo/fund`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          goal_amount: form.goal_amount ? parseFloat(form.goal_amount) : null,
          current_amount: form.current_amount ? parseFloat(form.current_amount) : 0,
          payment_link: form.payment_link || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdated(data.fund);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar la colecta?')) return;
    const res = await fetch(`/api/events/collaborative/${eventId}/regalo/fund`, { method: 'DELETE' });
    if (res.ok) onUpdated(null);
  };

  if (!fund) return null;

  if (editing) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
        <h3 className="font-bold text-green-800 text-sm mb-3">💰 {fund ? 'Editar colecta' : 'Nueva colecta'}</h3>
        <div className="flex flex-col gap-2">
          <input
            placeholder="Título *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <div className="flex gap-2">
            <input
              placeholder="Objetivo €"
              type="number"
              value={form.goal_amount}
              onChange={(e) => setForm({ ...form, goal_amount: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <input
              placeholder="Recaudado €"
              type="number"
              value={form.current_amount}
              onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <input
            placeholder="Enlace de pago (Bizum, PayPal, Revolut...)"
            value={form.payment_link}
            onChange={(e) => setForm({ ...form, payment_link: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <div className="flex gap-2 justify-end mt-1">
            {fund && (
              <button onClick={handleDelete} className="text-sm text-red-400 hover:text-red-600 px-3 py-1.5">
                Eliminar
              </button>
            )}
            <button onClick={() => setEditing(false)} className="text-sm text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || saving}
              className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-green-800 text-sm">💰 {fund!.title}</div>
          {fund!.description && <div className="text-green-700 text-xs mt-0.5">{fund!.description}</div>}
        </div>
        <div className="text-right">
          <div className="font-bold text-green-800 text-base">
            €{fund!.current_amount}
            {fund!.goal_amount && <span className="text-green-500 text-xs font-normal"> de €{fund!.goal_amount}</span>}
          </div>
        </div>
      </div>

      {progressPct !== null && (
        <div className="bg-green-200 rounded-full h-2 mb-3">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-green-700">
          {fund!.payment_link
            ? <span className="truncate max-w-[180px] block">{fund!.payment_link}</span>
            : <span className="text-green-400 italic">Sin enlace de pago</span>}
        </div>
        <div className="flex gap-2">
          {isOrganizer && (
            <button
              onClick={() => { setForm({ title: fund!.title, description: fund!.description || '', goal_amount: fund!.goal_amount?.toString() || '', current_amount: fund!.current_amount.toString(), payment_link: fund!.payment_link || '' }); setEditing(true); }}
              className="text-xs text-green-600 border border-green-300 px-2.5 py-1 rounded-lg hover:bg-green-100"
            >
              Editar
            </button>
          )}
          {fund!.payment_link && (
            <a
              href={fund!.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-green-700"
            >
              Contribuir →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
