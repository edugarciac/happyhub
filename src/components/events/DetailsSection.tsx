// src/components/events/DetailsSection.tsx
import { useState, useEffect, useCallback } from 'react';

interface DetailItem {
  id: number;
  title: string;
  category: 'decoration' | 'favors' | 'special_request' | 'other';
  description: string | null;
  quantity: number | null;
  responsible_participant_id: number | null;
  added_by_participant_id: number | null;
  done: boolean;
}

interface Participant {
  id: number;
  name: string;
}

interface DetailsSectionProps {
  eventId: number;
  isOrganizer: boolean;
  currentParticipantId: number | null;
  participants: Participant[];
}

const CATEGORIES: { value: DetailItem['category']; label: string; emoji: string }[] = [
  { value: 'decoration', label: 'Decoración', emoji: '🎈' },
  { value: 'favors', label: 'Detalles invitados', emoji: '🎁' },
  { value: 'special_request', label: 'Petición especial', emoji: '⚠️' },
  { value: 'other', label: 'Otro', emoji: '📌' },
];

export default function DetailsSection({ eventId, isOrganizer, currentParticipantId, participants }: DetailsSectionProps) {
  const [items, setItems] = useState<DetailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', category: 'other' as DetailItem['category'], description: '', quantity: '' });
  const [addingItem, setAddingItem] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/events/collaborative/${eventId}/detalles`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddItem = async () => {
    if (!addForm.title.trim()) return;
    setAddingItem(true);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/detalles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addForm.title,
          category: addForm.category,
          description: addForm.description || null,
          quantity: addForm.quantity ? parseInt(addForm.quantity, 10) : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => [...prev, data.item]);
        setAddForm({ title: '', category: 'other', description: '', quantity: '' });
        setShowAddForm(false);
      }
    } finally {
      setAddingItem(false);
    }
  };

  const updateItem = async (itemId: number, fields: Partial<Pick<DetailItem, 'done' | 'responsible_participant_id'>>) => {
    const res = await fetch(`/api/events/collaborative/${eventId}/detalles/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => prev.map((i) => (i.id === itemId ? data.item : i)));
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('¿Eliminar este detalle?')) return;
    const res = await fetch(`/api/events/collaborative/${eventId}/detalles/${itemId}`, { method: 'DELETE' });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  if (loading) return <p className="text-gray-400 text-sm text-center py-12">Cargando...</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-900 text-sm">
          🎀 Detalles del evento
          <span className="text-gray-400 font-normal ml-1.5 text-xs">
            ({items.length} ítem{items.length !== 1 ? 's' : ''}{items.filter((i) => i.done).length > 0 ? ` · ${items.filter((i) => i.done).length} hecho${items.filter((i) => i.done).length !== 1 ? 's' : ''}` : ''})
          </span>
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 font-semibold"
        >
          + Añadir
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex gap-2 mb-2">
            <select
              value={addForm.category}
              onChange={(e) => setAddForm({ ...addForm, category: e.target.value as DetailItem['category'] })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <input
              placeholder="Título *"
              value={addForm.title}
              onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              placeholder="Cantidad"
              type="number"
              value={addForm.quantity}
              onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <input
            placeholder="Descripción (opcional)"
            value={addForm.description}
            onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full mb-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddForm(false)} className="text-sm text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button
              onClick={handleAddItem}
              disabled={!addForm.title.trim() || addingItem}
              className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
            >
              {addingItem ? '...' : 'Añadir'}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8 bg-gray-50 rounded-xl">
          Sin detalles aún. Añade decoración, favors o peticiones especiales.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const cat = CATEGORIES.find((c) => c.value === item.category) ?? CATEGORIES[3];
            const canDelete = isOrganizer || item.added_by_participant_id === currentParticipantId;

            return (
              <div
                key={item.id}
                className={`bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 ${item.done ? 'opacity-60' : ''}`}
              >
                <button
                  onClick={() => updateItem(item.id, { done: !item.done })}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${
                    item.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent hover:border-violet-400'
                  }`}
                  title={item.done ? 'Marcar como pendiente' : 'Marcar como hecho'}
                >
                  ✓
                </button>
                <span className="text-xl flex-shrink-0">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {item.title}
                    {item.quantity ? <span className="text-gray-400 font-normal ml-1.5">× {item.quantity}</span> : null}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {cat.label}
                    {item.description ? ` · ${item.description}` : ''}
                  </div>
                </div>
                <select
                  value={item.responsible_participant_id ?? ''}
                  onChange={(e) => updateItem(item.id, { responsible_participant_id: e.target.value ? parseInt(e.target.value, 10) : null })}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 flex-shrink-0 max-w-[120px]"
                >
                  <option value="">Sin asignar</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-300 hover:text-red-400 p-1 transition-colors flex-shrink-0"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
