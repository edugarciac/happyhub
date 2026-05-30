import { useState, useEffect } from 'react';

export interface MilestoneTemplate {
  id: number;
  emoji: string | null;
  title: string;
  hito_type: string;
  phase: 'before' | 'during' | 'after';
}

interface AddMilestoneModalProps {
  eventId: number;
  eventType: string | null;
  existingTypes: string[];
  onClose: () => void;
  onAdded: (milestone: any) => void;
}

const PHASE_LABELS = { before: 'Antes', during: 'Durante', after: 'Después' };
const PHASES: Array<'before' | 'during' | 'after'> = ['before', 'during', 'after'];

export default function AddMilestoneModal({
  eventId, eventType, existingTypes, onClose, onAdded,
}: AddMilestoneModalProps) {
  const [templates, setTemplates] = useState<{ template: any; milestones: MilestoneTemplate[] }[]>([]);
  const [selectedType, setSelectedType] = useState<string>(eventType ?? '');
  const [adding, setAdding] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/event-templates')
      .then((r) => r.json())
      .then((d) => { setTemplates(d.templates || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const currentMilestones = selectedType
    ? templates.find((t) => t.template.event_type === selectedType)?.milestones ?? []
    : templates.flatMap((t) => t.milestones);

  const handleAdd = async (m: MilestoneTemplate) => {
    setAdding(m.hito_type);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: m.title,
          emoji: m.emoji,
          hito_type: m.hito_type,
          phase: m.phase,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onAdded(data.milestone);
        onClose();
      }
    } finally {
      setAdding(null);
    }
  };

  const allTypes = [...new Set(templates.map((t) => t.template.event_type))];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Añadir hito al timeline</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        {/* Selector de tipo de evento */}
        <div className="px-5 pt-4 pb-2 flex gap-2 flex-wrap">
          {allTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(selectedType === type ? '' : type)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                selectedType === type
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'border-gray-200 text-gray-600 hover:border-violet-300'
              }`}
            >
              {type}
            </button>
          ))}
          {selectedType && (
            <button
              onClick={() => setSelectedType('')}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600"
            >
              Ver todos
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Cargando plantillas...</div>
          ) : currentMilestones.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="mb-2">No hay plantillas disponibles.</p>
              <p className="text-xs">El administrador puede añadir plantillas desde el panel de admin.</p>
            </div>
          ) : (
            PHASES.map((phase) => {
              const items = currentMilestones.filter((m) => m.phase === phase);
              if (!items.length) return null;
              return (
                <div key={phase} className="mt-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {PHASE_LABELS[phase]}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((m) => {
                      const alreadyAdded = existingTypes.includes(m.hito_type);
                      return (
                        <button
                          key={m.id}
                          disabled={alreadyAdded || adding === m.hito_type}
                          onClick={() => handleAdd(m)}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${
                            alreadyAdded
                              ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50 cursor-pointer'
                          }`}
                        >
                          <span className="text-xl">{m.emoji || '📌'}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{m.title}</div>
                            {alreadyAdded && <div className="text-[10px] text-gray-400">Ya añadido</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
