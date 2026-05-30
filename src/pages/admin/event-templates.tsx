import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';

interface Milestone {
  id: number;
  template_id: number;
  emoji: string | null;
  title: string;
  hito_type: string;
  phase: 'before' | 'during' | 'after';
  sort_order: number;
}

interface Template {
  template: { id: number; event_type: string; name: string };
  milestones: Milestone[];
}

const PHASE_LABELS = { before: 'Antes', during: 'Durante', after: 'Después' };
const PHASES: Array<'before' | 'during' | 'after'> = ['before', 'during', 'after'];

const emptyMilestoneForm: { emoji: string; title: string; hito_type: string; phase: 'before' | 'during' | 'after'; sort_order: number } = { emoji: '', title: '', hito_type: '', phase: 'before', sort_order: 0 };

export default function AdminEventTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState({ event_type: '', name: '' });
  const [addingMilestone, setAddingMilestone] = useState<number | null>(null);
  const [milestoneForm, setMilestoneForm] = useState(emptyMilestoneForm);

  const fetchTemplates = () => {
    fetch('/api/admin/event-templates')
      .then((r) => r.json())
      .then((d) => { setTemplates(d.templates || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplate.event_type || !newTemplate.name) return;
    const res = await fetch('/api/admin/event-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_template', ...newTemplate }),
    });
    if (res.ok) {
      toast.success('Plantilla creada');
      setNewTemplate({ event_type: '', name: '' });
      fetchTemplates();
    }
  };

  const handleAddMilestone = async (templateId: number) => {
    if (!milestoneForm.title || !milestoneForm.hito_type) return;
    const res = await fetch('/api/admin/event-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_milestone', template_id: templateId, ...milestoneForm }),
    });
    if (res.ok) {
      toast.success('Hito añadido');
      setAddingMilestone(null);
      setMilestoneForm(emptyMilestoneForm);
      fetchTemplates();
    }
  };

  const handleDelete = async (type: 'template' | 'milestone', id: number) => {
    if (!confirm(`¿Eliminar este ${type === 'template' ? 'plantilla' : 'hito'}?`)) return;
    const res = await fetch('/api/admin/event-templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    });
    if (res.ok) {
      toast.success('Eliminado');
      fetchTemplates();
    }
  };

  return (
    <AdminLayout>
      <Head><title>Plantillas de evento – Admin HappyHub</title></Head>
      <Toaster />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Plantillas de evento</h1>
            <p className="text-gray-500 text-sm mt-1">Configura los hitos por defecto para cada tipo de evento</p>
          </div>
        </div>

        {/* Crear nueva plantilla */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">Nueva plantilla</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Tipo (ej: birthday)"
              value={newTemplate.event_type}
              onChange={(e) => setNewTemplate({ ...newTemplate, event_type: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              type="text"
              placeholder="Nombre (ej: Cumpleaños)"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button
              onClick={handleCreateTemplate}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Crear
            </button>
          </div>
        </div>

        {/* Lista de plantillas */}
        {loading ? (
          <p className="text-gray-400 text-center py-10">Cargando...</p>
        ) : templates.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No hay plantillas. Crea la primera.</p>
        ) : (
          templates.map(({ template, milestones }) => (
            <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-bold text-gray-900">{template.name}</span>
                  <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{template.event_type}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setAddingMilestone(template.id); setMilestoneForm(emptyMilestoneForm); }}
                    className="text-violet-600 border border-violet-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-violet-50 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Añadir hito
                  </button>
                  <button
                    onClick={() => handleDelete('template', template.id)}
                    className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Formulario añadir hito */}
              {addingMilestone === template.id && (
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-4 grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Emoji (ej: 📩)" value={milestoneForm.emoji} onChange={(e) => setMilestoneForm({ ...milestoneForm, emoji: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  <input type="text" placeholder="Título *" value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  <input type="text" placeholder="hito_type (ej: invitations) *" value={milestoneForm.hito_type} onChange={(e) => setMilestoneForm({ ...milestoneForm, hito_type: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  <select value={milestoneForm.phase} onChange={(e) => setMilestoneForm({ ...milestoneForm, phase: e.target.value as 'before' | 'during' | 'after' })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                    {PHASES.map((p) => <option key={p} value={p}>{PHASE_LABELS[p]}</option>)}
                  </select>
                  <div className="col-span-2 flex gap-2 justify-end">
                    <button onClick={() => setAddingMilestone(null)} className="text-sm text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancelar</button>
                    <button onClick={() => handleAddMilestone(template.id)} className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-violet-700">Guardar hito</button>
                  </div>
                </div>
              )}

              {/* Hitos por fase */}
              {PHASES.map((phase) => {
                const items = milestones.filter((m) => m.phase === phase);
                if (!items.length) return null;
                return (
                  <div key={phase} className="mb-3">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-2">{PHASE_LABELS[phase]}</div>
                    <div className="flex flex-wrap gap-2">
                      {items.map((m) => (
                        <div key={m.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                          {m.emoji && <span>{m.emoji}</span>}
                          <span className="font-medium text-gray-700">{m.title}</span>
                          <span className="text-gray-400 text-xs">({m.hito_type})</span>
                          <button onClick={() => handleDelete('milestone', m.id)} className="text-gray-300 hover:text-red-400 ml-1">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {milestones.length === 0 && (
                <p className="text-gray-400 text-sm">Sin hitos. Añade el primero.</p>
              )}
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
