import { useState } from 'react';
import type { CollaborativeEventTimeline } from '@/utils/db/collaborative-events';

interface TimelineDetailPanelProps {
  milestone: CollaborativeEventTimeline;
  onClose: () => void;
  onUpdate: (updated: CollaborativeEventTimeline) => void;
  eventId: number;
  isOrganizer: boolean;
}

export default function TimelineDetailPanel({
  milestone, onClose, onUpdate, eventId, isOrganizer,
}: TimelineDetailPanelProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: milestone.title,
    time: milestone.time?.slice(0, 5) ?? '',
    description: milestone.description ?? '',
    completed: milestone.completed,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/timeline/${milestone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          time: form.time || null,
          description: form.description || null,
          completed: form.completed,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.milestone);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5 border-l-4 border-l-violet-400">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{milestone.emoji || '📌'}</span>
          <h3 className="font-bold text-gray-900">{milestone.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg font-bold"
        >
          ✕
        </button>
      </div>

      {isOrganizer ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Hora</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notas</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="completed"
              checked={form.completed}
              onChange={(e) => setForm({ ...form, completed: e.target.checked })}
              className="w-4 h-4 accent-green-500"
            />
            <label htmlFor="completed" className="text-sm font-medium text-gray-700">Marcar como completado</label>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600 space-y-2">
          {milestone.time && <p>🕕 {milestone.time.slice(0, 5)}</p>}
          {milestone.description && <p>{milestone.description}</p>}
          <p>{milestone.completed ? '✅ Completado' : '⏳ Pendiente'}</p>
        </div>
      )}
    </div>
  );
}
