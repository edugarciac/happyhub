import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface ActivityTemplate {
  id: number;
  title: string;
  description: string | null;
  event_types: string[];
  participant_types: string[];
  tags: string[];
  usage_count: number;
  admin_notes: string | null;
}

const emptyForm = {
  title: '',
  description: '',
  event_types: [] as string[],
  participant_types: [] as string[],
  tags: '',
  admin_notes: '',
};

const EVENT_TYPE_OPTIONS = ['cumpleaños', 'boda', 'despedida', 'comunión', 'bautizo', 'empresa', 'navidad', 'halloween'];
const PARTICIPANT_TYPE_OPTIONS = ['niños', 'adultos', 'mixto', 'empresa', 'tercera edad', 'jóvenes'];

export default function AdminActivityTemplates() {
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    const res = await fetch('/api/admin/activity-templates');
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates);
    } else {
      toast.error('Error cargando actividades');
    }
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openCreate = () => {
    setEditingTemplate(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (t: ActivityTemplate) => {
    setEditingTemplate(t);
    setForm({
      title: t.title,
      description: t.description || '',
      event_types: t.event_types || [],
      participant_types: t.participant_types || [],
      tags: (t.tags || []).join(', '),
      admin_notes: t.admin_notes || '',
    });
    setShowForm(true);
  };

  const toggleArrayItem = (field: 'event_types' | 'participant_types', value: string) => {
    setForm(prev => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('El título es obligatorio'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        event_types: form.event_types,
        participant_types: form.participant_types,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        admin_notes: form.admin_notes || null,
      };
      const url = editingTemplate
        ? `/api/admin/activity-templates/${editingTemplate.id}`
        : '/api/admin/activity-templates';
      const method = editingTemplate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error guardando'); return; }

      toast.success(editingTemplate ? 'Template actualizado' : 'Template creado');
      setShowForm(false);
      fetchTemplates();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: ActivityTemplate) => {
    if (!confirm(`¿Eliminar "${t.title}"?`)) return;
    const res = await fetch(`/api/admin/activity-templates/${t.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Eliminado'); fetchTemplates(); }
    else toast.error('Error eliminando');
  };

  return (
    <>
      <Head><title>Actividades — Admin HappyHub</title></Head>
      <AdminLayout>
        <Toaster />
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Base de conocimiento — Actividades</h1>
              <p className="text-sm text-gray-500 mt-1">
                Plantillas que el asesor IA usa para recomendar actividades. El contador de uso crece automáticamente.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Nueva actividad
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : templates.length === 0 ? (
            <p className="text-gray-400 text-center py-12">Sin templates. Añade el primero.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actividad</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tipos de evento</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Participantes</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Usos</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {templates.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{t.title}</div>
                        {t.description && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(t.event_types || []).map(et => (
                            <span key={et} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{et}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(t.participant_types || []).map(pt => (
                            <span key={pt} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">{pt}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-gray-700">{t.usage_count}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-indigo-600">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(t)} className="text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="font-semibold text-gray-900">
                  {editingTemplate ? 'Editar actividad' : 'Nueva actividad'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="ej: Karaoke"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Breve descripción de la actividad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipos de evento</label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPE_OPTIONS.map(et => (
                      <button
                        key={et}
                        type="button"
                        onClick={() => toggleArrayItem('event_types', et)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          form.event_types.includes(et)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-600 hover:border-blue-400'
                        }`}
                      >
                        {et}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipos de participantes</label>
                  <div className="flex flex-wrap gap-2">
                    {PARTICIPANT_TYPE_OPTIONS.map(pt => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => toggleArrayItem('participant_types', pt)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          form.participant_types.includes(pt)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'border-gray-300 text-gray-600 hover:border-purple-400'
                        }`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separados por coma)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="musica, baile, grupal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas (admin)</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    value={form.admin_notes}
                    onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
