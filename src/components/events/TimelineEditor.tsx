import { useState } from 'react';
import { Plus, Trash2, Clock, Edit2, Check, X } from 'lucide-react';
import type { CollaborativeEventTimeline, CollaborativeEventParticipant } from '@/utils/db/collaborative-events';

interface Props {
  timeline: CollaborativeEventTimeline[];
  participants: CollaborativeEventParticipant[];
  eventId: number;
  canEdit: boolean;
  onAdd: (entry: Omit<CollaborativeEventTimeline, 'id'>) => Promise<void>;
  onUpdate: (id: number, data: Partial<CollaborativeEventTimeline>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

interface EntryForm {
  time: string;
  title: string;
  description: string;
  responsible_participant_id: string;
}

const EMPTY_FORM: EntryForm = { time: '', title: '', description: '', responsible_participant_id: '' };

export default function TimelineEditor({ timeline, participants, eventId, canEdit, onAdd, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EntryForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EntryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.time || !form.title) return;
    setSaving(true);
    await onAdd({
      event_id: eventId,
      time: form.time || null,
      title: form.title,
      description: form.description || null,
      responsible_participant_id: form.responsible_participant_id
        ? parseInt(form.responsible_participant_id)
        : null,
      sort_order: timeline.length,
      phase: 'during',
      emoji: null,
      hito_type: null,
      detail_data: null,
      completed: false,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
  };

  const handleStartEdit = (entry: CollaborativeEventTimeline) => {
    setEditingId(entry.id);
    setEditForm({
      time: entry.time ?? '',
      title: entry.title,
      description: entry.description || '',
      responsible_participant_id: entry.responsible_participant_id?.toString() || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    await onUpdate(editingId, {
      time: editForm.time,
      title: editForm.title,
      description: editForm.description || null,
      responsible_participant_id: editForm.responsible_participant_id
        ? parseInt(editForm.responsible_participant_id)
        : null,
    });
    setEditingId(null);
    setSaving(false);
  };

  const getParticipantName = (id: number | null) => {
    if (!id) return null;
    return participants.find((p) => p.id === id)?.name;
  };

  return (
    <div className="space-y-3">
      {timeline.length === 0 && !showForm && (
        <p className="text-gray-400 text-sm text-center py-6">
          El timeline está vacío. Añade los momentos del día.
        </p>
      )}

      {timeline.map((entry) => (
        <div key={entry.id} className="flex gap-3 items-start">
          <div className="flex-shrink-0 w-14 text-right">
            <span className="text-sm font-mono font-semibold text-purple-700">{entry.time?.slice(0, 5)}</span>
          </div>

          <div className="flex-1 border-l-2 border-purple-200 pl-4 pb-2">
            {editingId === entry.id ? (
              <div className="space-y-2">
                <input
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
                />
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                  placeholder="Título"
                />
                <input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                  placeholder="Descripción (opcional)"
                />
                <select
                  value={editForm.responsible_participant_id}
                  onChange={(e) => setEditForm({ ...editForm, responsible_participant_id: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                >
                  <option value="">Sin responsable</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-1 text-xs bg-purple-600 text-white px-2 py-1 rounded">
                    <Check className="w-3 h-3" /> Guardar
                  </button>
                  <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-xs text-gray-500 px-2 py-1 rounded border">
                    <X className="w-3 h-3" /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{entry.title}</p>
                    {entry.description && (
                      <p className="text-gray-500 text-xs mt-0.5">{entry.description}</p>
                    )}
                    {entry.responsible_participant_id && (
                      <p className="text-purple-600 text-xs mt-0.5">
                        → {getParticipantName(entry.responsible_participant_id)}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleStartEdit(entry)} className="text-gray-400 hover:text-purple-600 p-1">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDelete(entry.id)} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {canEdit && (
        showForm ? (
          <div className="border border-purple-200 rounded-xl p-4 space-y-2 bg-purple-50">
            <div className="flex gap-2">
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm w-32"
              />
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1"
                placeholder="Qué ocurre..."
              />
            </div>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full"
              placeholder="Descripción (opcional)"
            />
            <select
              value={form.responsible_participant_id}
              onChange={(e) => setForm({ ...form, responsible_participant_id: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm w-full"
            >
              <option value="">Sin responsable</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!form.time || !form.title || saving}
                className="flex items-center gap-1 text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Añadir
              </button>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="text-sm text-gray-500 px-3 py-1.5 rounded-lg border">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium py-2"
          >
            <Plus className="w-4 h-4" />
            Añadir momento
          </button>
        )
      )}
    </div>
  );
}
