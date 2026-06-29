// src/components/events/RemindersSection.tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Check, Bell, Calendar } from 'lucide-react';
import type { CollaborativeEventParticipant } from '@/utils/db/collaborative-events';

interface Reminder {
  id: number;
  title: string;
  notes: string | null;
  due_date: string | null;
  emoji: string | null;
  assigned_participant_id: number | null;
  completed: boolean;
}

interface RemindersSectionProps {
  eventId: number;
  participants: CollaborativeEventParticipant[];
}

export default function RemindersSection({ eventId, participants }: RemindersSectionProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ title: '', notes: '', due_date: '', assigned_participant_id: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/events/collaborative/${eventId}/reminders`);
    if (res.ok) {
      const data = await res.json();
      setReminders(data.reminders);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          notes: form.notes || null,
          due_date: form.due_date || null,
          assigned_participant_id: form.assigned_participant_id ? parseInt(form.assigned_participant_id, 10) : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReminders((prev) => [...prev, data.reminder]);
        setForm({ title: '', notes: '', due_date: '', assigned_participant_id: '' });
        setShowAddForm(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (reminder: Reminder) => {
    const res = await fetch(`/api/events/collaborative/${eventId}/reminders/${reminder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !reminder.completed }),
    });
    if (res.ok) {
      const data = await res.json();
      setReminders((prev) => prev.map((r) => (r.id === reminder.id ? data.reminder : r)));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este recordatorio?')) return;
    const res = await fetch(`/api/events/collaborative/${eventId}/reminders/${id}`, { method: 'DELETE' });
    if (res.ok) setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const participantName = (id: number | null) => participants.find((p) => p.id === id)?.name ?? null;

  if (loading) return <p className="text-gray-400 text-sm text-center py-12">Cargando...</p>;

  const pending = reminders.filter((r) => !r.completed);
  const completed = reminders.filter((r) => r.completed);

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-violet-500" /> Recordatorios
          <span className="text-gray-400 font-normal ml-1 text-xs">
            ({pending.length} pendiente{pending.length !== 1 ? 's' : ''})
          </span>
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 font-semibold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Añadir
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <input
            placeholder="¿Qué hay que recordar? *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full mb-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <textarea
            placeholder="Notas (opcional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full mb-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
            rows={2}
          />
          <div className="flex gap-2 mb-2">
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <select
              value={form.assigned_participant_id}
              onChange={(e) => setForm({ ...form, assigned_participant_id: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="">Sin asignar</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddForm(false)} className="text-sm text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!form.title.trim() || saving}
              className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? '...' : 'Añadir'}
            </button>
          </div>
        </div>
      )}

      {reminders.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8 bg-gray-50 rounded-xl">
          Sin recordatorios aún. Añade el primero para no olvidar nada.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {[...pending, ...completed].map((reminder) => {
            const assignedName = participantName(reminder.assigned_participant_id);
            return (
              <div
                key={reminder.id}
                className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 ${reminder.completed ? 'opacity-50 border-gray-100' : 'border-gray-200'}`}
              >
                <button
                  onClick={() => handleToggle(reminder)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                    reminder.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-violet-400'
                  }`}
                >
                  {reminder.completed && <Check className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm text-gray-900 ${reminder.completed ? 'line-through' : ''}`}>
                    {reminder.title}
                  </div>
                  {reminder.notes && <p className="text-xs text-gray-500 mt-0.5">{reminder.notes}</p>}
                  <div className="text-xs text-gray-400 flex gap-3 mt-1">
                    {reminder.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(reminder.due_date).toLocaleDateString('es-ES')}
                      </span>
                    )}
                    {assignedName && <span>👤 {assignedName}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="text-gray-300 hover:text-red-400 p-1 transition-colors flex-shrink-0"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
