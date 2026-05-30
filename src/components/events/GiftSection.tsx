// src/components/events/GiftSection.tsx
import { useState, useEffect, useCallback } from 'react';
import GiftFundCard from './GiftFundCard';
import GiftAdvisor from './GiftAdvisor';

interface GiftItem {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  price_approx: number | null;
  emoji: string | null;
  added_by_participant_id: number | null;
  reserved_by_participant_id: number | null;
  reserved_at: string | null;
}

interface GiftFund {
  id: number;
  title: string;
  description: string | null;
  goal_amount: number | null;
  current_amount: number;
  payment_link: string | null;
}

interface GiftSectionProps {
  eventId: number;
  isOrganizer: boolean;
  currentParticipantId: number | null;
  eventType: string | null;
}

export default function GiftSection({ eventId, isOrganizer, currentParticipantId, eventType }: GiftSectionProps) {
  const [items, setItems] = useState<GiftItem[]>([]);
  const [fund, setFund] = useState<GiftFund | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', description: '', url: '', price_approx: '', emoji: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [reservingId, setReservingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/events/collaborative/${eventId}/regalo`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setFund(data.fund);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddItem = async (itemData?: { title: string; description: string; url: string | null; price_approx: number | null; emoji: string }) => {
    const payload = itemData || {
      title: addForm.title,
      description: addForm.description || null,
      url: addForm.url || null,
      price_approx: addForm.price_approx ? parseFloat(addForm.price_approx) : null,
      emoji: addForm.emoji || null,
    };
    if (!payload.title.trim()) return;

    setAddingItem(true);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/regalo/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => [...prev, data.item]);
        setAddForm({ title: '', description: '', url: '', price_approx: '', emoji: '' });
        setShowAddForm(false);
      }
    } finally {
      setAddingItem(false);
    }
  };

  const handleReserve = async (itemId: number) => {
    setReservingId(itemId);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/regalo/items/${itemId}/reserve`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => prev.map((i) => i.id === itemId ? data.item : i));
      }
    } finally {
      setReservingId(null);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('¿Eliminar este ítem?')) return;
    const res = await fetch(`/api/events/collaborative/${eventId}/regalo/items/${itemId}`, { method: 'DELETE' });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const getReserveState = (item: GiftItem) => {
    if (item.reserved_by_participant_id === null) return 'free';
    if (item.reserved_by_participant_id === currentParticipantId) return 'mine';
    return 'other';
  };

  if (loading) return <p className="text-gray-400 text-sm text-center py-12">Cargando...</p>;

  return (
    <div className="max-w-3xl">
      {/* Colecta */}
      <GiftFundCard
        eventId={eventId}
        fund={fund}
        isOrganizer={isOrganizer}
        onUpdated={setFund}
      />

      {/* Wishlist header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-900 text-sm">
          🛍️ Lista de deseos
          <span className="text-gray-400 font-normal ml-1.5 text-xs">
            ({items.length} ítem{items.length !== 1 ? 's' : ''}{items.filter(i => i.reserved_by_participant_id).length > 0 ? ` · ${items.filter(i => i.reserved_by_participant_id).length} reservado${items.filter(i => i.reserved_by_participant_id).length !== 1 ? 's' : ''}` : ''})
          </span>
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 font-semibold"
        >
          + Añadir
        </button>
      </div>

      {/* Add item form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex gap-2 mb-2">
            <input
              placeholder="Emoji (opcional)"
              value={addForm.emoji}
              onChange={(e) => setAddForm({ ...addForm, emoji: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              placeholder="Nombre del regalo *"
              value={addForm.title}
              onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              placeholder="Precio ~€"
              type="number"
              value={addForm.price_approx}
              onChange={(e) => setAddForm({ ...addForm, price_approx: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <input
            placeholder="Enlace (opcional)"
            value={addForm.url}
            onChange={(e) => setAddForm({ ...addForm, url: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full mb-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddForm(false)} className="text-sm text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button
              onClick={() => handleAddItem()}
              disabled={!addForm.title.trim() || addingItem}
              className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
            >
              {addingItem ? '...' : 'Añadir'}
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8 bg-gray-50 rounded-xl">
          Sin ítems aún. Añade el primero o usa el asesor IA.
        </p>
      ) : (
        <div className="flex flex-col gap-2 mb-5">
          {items.map((item) => {
            const reserveState = getReserveState(item);
            const canDelete = isOrganizer || item.added_by_participant_id === currentParticipantId;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 ${reserveState === 'other' ? 'opacity-60' : 'border-gray-200'}`}
              >
                <span className="text-xl flex-shrink-0">{item.emoji || '🎁'}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${reserveState === 'other' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-400 flex gap-2 mt-0.5">
                    {item.price_approx && <span>~€{item.price_approx}</span>}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline truncate max-w-[160px]">
                        {(() => { try { return new URL(item.url!).hostname; } catch { return item.url; } })()}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {reserveState === 'free' && (
                    <button
                      onClick={() => handleReserve(item.id)}
                      disabled={reservingId === item.id}
                      className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 disabled:opacity-50 font-semibold"
                    >
                      {reservingId === item.id ? '...' : 'Reservar'}
                    </button>
                  )}
                  {reserveState === 'mine' && (
                    <button
                      onClick={() => handleReserve(item.id)}
                      disabled={reservingId === item.id}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 disabled:opacity-50 font-semibold"
                    >
                      {reservingId === item.id ? '...' : '✓ Reservado'}
                    </button>
                  )}
                  {reserveState === 'other' && (
                    <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg font-semibold">
                      Reservado
                    </span>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-300 hover:text-red-400 p-1 transition-colors"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Advisor CTA */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">✨</span>
        <div className="flex-1">
          <p className="font-bold text-violet-700 text-sm">Asesor de regalos IA</p>
          <p className="text-violet-500 text-xs">Describe a la persona y te sugiero ideas con enlaces reales</p>
        </div>
        <button
          onClick={() => setShowAdvisor(true)}
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 flex-shrink-0"
        >
          Abrir →
        </button>
      </div>

      {/* AI Advisor Modal */}
      {showAdvisor && (
        <GiftAdvisor
          eventId={eventId}
          eventType={eventType}
          onAddToList={handleAddItem}
          onClose={() => setShowAdvisor(false)}
        />
      )}
    </div>
  );
}
