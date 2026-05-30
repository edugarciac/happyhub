// src/components/events/GiftAdvisor.tsx
import { useState } from 'react';

interface GiftSuggestion {
  title: string;
  description: string;
  price_approx: string;
  url: string | null;
  emoji: string;
}

interface GiftAdvisorProps {
  eventId: number;
  eventType: string | null;
  onAddToList: (item: { title: string; description: string; url: string | null; price_approx: number | null; emoji: string }) => Promise<void>;
  onClose: () => void;
}

const BUDGET_OPTIONS = ['Hasta €30', '€30–€80', '€80–€150', 'Más de €150'];

const EVENT_TYPE_OPTIONS = [
  '🎂 Cumpleaños',
  '💍 Boda',
  '🎓 Graduación',
  '🎄 Navidad',
  '👶 Baby shower',
  '🏠 Inauguración',
  '❤️ San Valentín',
  'Otro',
];

export default function GiftAdvisor({ eventId, eventType, onAddToList, onClose }: GiftAdvisorProps) {
  const [personDescription, setPersonDescription] = useState('');
  const [selectedEventType, setSelectedEventType] = useState(
    eventType ? EVENT_TYPE_OPTIONS.find((o) => o.toLowerCase().includes(eventType.toLowerCase())) || EVENT_TYPE_OPTIONS[0]
    : EVENT_TYPE_OPTIONS[0]
  );
  const [budget, setBudget] = useState(BUDGET_OPTIONS[1]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!personDescription.trim()) return;
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/regalo/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personDescription, eventType: selectedEventType, budget }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al generar sugerencias'); return; }
      setSuggestions(data.suggestions);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (suggestion: GiftSuggestion, index: number) => {
    setAddingIndex(index);
    try {
      const priceMatch = suggestion.price_approx.match(/[\d,.]+/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : null;
      await onAddToList({
        title: suggestion.title,
        description: suggestion.description,
        url: suggestion.url,
        price_approx: price,
        emoji: suggestion.emoji,
      });
    } finally {
      setAddingIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-white font-bold text-lg">✨ Asesor de regalos IA</h2>
            <p className="text-violet-200 text-xs mt-0.5">Describe a la persona y genera ideas con enlaces reales</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-5">
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">¿Para quién es el regalo? *</label>
            <textarea
              value={personDescription}
              onChange={(e) => setPersonDescription(e.target.value)}
              placeholder="Ej: mujer de 35 años, le encanta la fotografía y el yoga, viaja mucho"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de evento</label>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Presupuesto</label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {BUDGET_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!personDescription.trim() || loading}
            className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors mb-4"
          >
            {loading ? '✨ Generando ideas...' : '✨ Generar ideas'}
          </button>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          {suggestions.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ideas generadas</p>
              <div className="flex flex-col gap-3">
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-violet-50 border border-violet-100 rounded-xl p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm text-gray-900">{s.emoji} {s.title}</span>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{s.price_approx}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{s.description}</p>
                    <div className="flex gap-2">
                      {s.url && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-600 border border-violet-200 px-2.5 py-1 rounded-lg hover:bg-violet-100"
                        >
                          Ver →
                        </a>
                      )}
                      <button
                        onClick={() => handleAdd(s, i)}
                        disabled={addingIndex === i}
                        className="text-xs bg-violet-600 text-white px-2.5 py-1 rounded-lg hover:bg-violet-700 disabled:opacity-50"
                      >
                        {addingIndex === i ? '...' : '+ Añadir a lista'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
