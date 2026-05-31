// src/components/events/ActivityAdvisor.tsx
import { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';

interface ActivitySuggestion {
  title: string;
  description: string;
  emoji: string;
  tags: string[];
}

interface Props {
  eventId: number;
  onAddActivity: (title: string, description: string) => Promise<void>;
  onClose: () => void;
}

const PARTICIPANT_TYPE_OPTIONS = [
  { value: 'niños', label: '👶 Niños' },
  { value: 'adultos', label: '🧑 Adultos' },
  { value: 'mixto', label: '👨‍👩‍👧 Mixto' },
  { value: 'empresa', label: '💼 Empresa' },
  { value: 'tercera edad', label: '👴 Tercera edad' },
  { value: 'jóvenes', label: '🎉 Jóvenes' },
];

export default function ActivityAdvisor({ eventId, onAddActivity, onClose }: Props) {
  const [participantTypes, setParticipantTypes] = useState<string[]>([]);
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);

  const toggleParticipantType = (value: string) => {
    setParticipantTypes(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleGenerate = async () => {
    if (participantTypes.length === 0) return;
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/activities/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantTypes, context: context || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error generando sugerencias'); return; }
      setSuggestions(data.suggestions);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (suggestion: ActivitySuggestion, index: number) => {
    setAddingIndex(index);
    try {
      await onAddActivity(suggestion.title, suggestion.description);
    } finally {
      setAddingIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Sugerencias de actividades IA</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tipos de participantes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipos de participantes *
            </label>
            <div className="flex flex-wrap gap-2">
              {PARTICIPANT_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleParticipantType(opt.value)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    participantTypes.includes(opt.value)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-gray-300 text-gray-600 hover:border-purple-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contexto adicional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contexto adicional (opcional)
            </label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={2}
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="ej: ambiente tranquilo, espacio pequeño, grupo de 20 personas..."
            />
          </div>

          {/* Botón generar */}
          <button
            onClick={handleGenerate}
            disabled={loading || participantTypes.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando ideas...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generar ideas
              </>
            )}
          </button>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          {/* Sugerencias */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {suggestions.length} ideas generadas
              </div>
              {suggestions.map((s, i) => (
                <div key={i} className="border rounded-lg p-3 hover:bg-purple-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {s.emoji} {s.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>
                      {s.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {s.tags.map(tag => (
                            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleAdd(s, i)}
                      disabled={addingIndex === i}
                      className="flex items-center gap-1 bg-purple-600 text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex-shrink-0"
                    >
                      <Plus className="h-3 w-3" />
                      {addingIndex === i ? '...' : 'Añadir'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
