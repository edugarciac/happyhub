import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Check, Inbox } from 'lucide-react';

interface EventTypeOption {
  id: number;
  name: string;
}

interface ActivityTemplate {
  id: number;
  title: string;
  description: string | null;
  event_type_details: EventTypeOption[];
  participant_types: string[];
  tags: string[];
  usage_count: number;
  admin_notes: string | null;
}

interface Proposal {
  id: number;
  title: string;
  description: string | null;
  event_title: string;
  proposed_by_name: string | null;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

const emptyForm = {
  title: '',
  description: '',
  event_type_ids: [] as number[],
  participant_types: [] as string[],
  tags: '',
  admin_notes: '',
};

const PARTICIPANT_TYPE_OPTIONS = ['niños', 'adultos', 'mixto', 'empresa', 'tercera edad', 'jóvenes'];

type MainTab = 'catalog' | 'proposals';

export default function AdminActividadesCatalogo() {
  const [tab, setTab] = useState<MainTab>('catalog');

  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [reviewing, setReviewing] = useState<Proposal | null>(null);
  const [reviewEventTypeIds, setReviewEventTypeIds] = useState<number[]>([]);
  const [reviewParticipantTypes, setReviewParticipantTypes] = useState<string[]>([]);
  const [reviewTags, setReviewTags] = useState('');
  const [reviewing_, setReviewing_] = useState(false);

  const fetchTemplates = async () => {
    const res = await fetch('/api/admin/actividades-catalogo');
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates);
    } else {
      toast.error('Error cargando el catálogo');
    }
    setLoading(false);
  };

  const fetchEventTypes = async () => {
    const res = await fetch('/api/admin/event-types');
    if (res.ok) {
      const data = await res.json();
      setEventTypes(data.eventTypes);
    }
  };

  const fetchProposals = async () => {
    setLoadingProposals(true);
    const res = await fetch('/api/admin/actividades-catalogo/proposals?status=pending');
    if (res.ok) {
      const data = await res.json();
      setProposals(data.proposals);
    }
    setLoadingProposals(false);
  };

  useEffect(() => { fetchTemplates(); fetchEventTypes(); fetchProposals(); }, []);

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
      event_type_ids: (t.event_type_details || []).map(et => et.id),
      participant_types: t.participant_types || [],
      tags: (t.tags || []).join(', '),
      admin_notes: t.admin_notes || '',
    });
    setShowForm(true);
  };

  const toggleEventType = (id: number) => {
    setForm(prev => ({
      ...prev,
      event_type_ids: prev.event_type_ids.includes(id)
        ? prev.event_type_ids.filter(v => v !== id)
        : [...prev.event_type_ids, id],
    }));
  };

  const toggleParticipantType = (value: string) => {
    setForm(prev => ({
      ...prev,
      participant_types: prev.participant_types.includes(value)
        ? prev.participant_types.filter(v => v !== value)
        : [...prev.participant_types, value],
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('El título es obligatorio'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        event_type_ids: form.event_type_ids,
        participant_types: form.participant_types,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        admin_notes: form.admin_notes || null,
      };
      const url = editingTemplate
        ? `/api/admin/actividades-catalogo/${editingTemplate.id}`
        : '/api/admin/actividades-catalogo';
      const method = editingTemplate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error guardando'); return; }

      toast.success(editingTemplate ? 'Actividad actualizada' : 'Actividad creada');
      setShowForm(false);
      fetchTemplates();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: ActivityTemplate) => {
    if (!confirm(`¿Eliminar "${t.title}"?`)) return;
    const res = await fetch(`/api/admin/actividades-catalogo/${t.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Eliminado'); fetchTemplates(); }
    else toast.error('Error eliminando');
  };

  const openReview = (p: Proposal) => {
    setReviewing(p);
    setReviewEventTypeIds([]);
    setReviewParticipantTypes([]);
    setReviewTags('');
  };

  const handleApprove = async () => {
    if (!reviewing) return;
    setReviewing_(true);
    try {
      const res = await fetch(`/api/admin/actividades-catalogo/proposals/${reviewing.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTypeIds: reviewEventTypeIds,
          participantTypes: reviewParticipantTypes,
          tags: reviewTags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        toast.success('Actividad añadida al catálogo');
        setReviewing(null);
        fetchProposals();
        fetchTemplates();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error aprobando la propuesta');
      }
    } finally {
      setReviewing_(false);
    }
  };

  const handleReject = async (p: Proposal) => {
    if (!confirm(`¿Rechazar la propuesta "${p.title}"?`)) return;
    const res = await fetch(`/api/admin/actividades-catalogo/proposals/${p.id}/reject`, { method: 'POST' });
    if (res.ok) { toast.success('Propuesta rechazada'); fetchProposals(); }
    else toast.error('Error rechazando');
  };

  return (
    <>
      <Head><title>Catálogo de Actividades — Admin HappyHub</title></Head>
      <AdminLayout>
        <Toaster />
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Catálogo de actividades</h1>
              <p className="text-sm text-gray-500 mt-1">
                Actividades sugeridas a los usuarios al planificar su evento, y base para el asesor IA.
              </p>
            </div>
            {tab === 'catalog' && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" /> Nueva actividad
              </button>
            )}
          </div>

          <div className="flex mb-6 border border-gray-200 rounded-lg overflow-hidden w-fit">
            <button
              onClick={() => setTab('catalog')}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${tab === 'catalog' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Catálogo
            </button>
            <button
              onClick={() => setTab('proposals')}
              className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 ${tab === 'proposals' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Propuestas pendientes
              {proposals.length > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === 'proposals' ? 'bg-white text-indigo-600' : 'bg-amber-100 text-amber-700'}`}>
                  {proposals.length}
                </span>
              )}
            </button>
          </div>

          {tab === 'catalog' ? (
            loading ? (
              <p className="text-gray-500">Cargando...</p>
            ) : templates.length === 0 ? (
              <p className="text-gray-400 text-center py-12">Sin actividades. Añade la primera.</p>
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
                            {(t.event_type_details || []).length === 0 ? (
                              <span className="text-gray-300 text-xs">Todos</span>
                            ) : (
                              t.event_type_details.map(et => (
                                <span key={et.id} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{et.name}</span>
                              ))
                            )}
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
            )
          ) : loadingProposals ? (
            <p className="text-gray-500">Cargando propuestas...</p>
          ) : proposals.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No hay propuestas pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map(p => (
                <div key={p.id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{p.title}</p>
                    {p.description && <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>}
                    <p className="text-xs text-gray-400 mt-1.5">
                      Propuesta por {p.proposed_by_name || 'un participante'} · evento &quot;{p.event_title}&quot;
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openReview(p)}
                      className="bg-green-100 text-green-700 hover:bg-green-200 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(p)}
                      className="bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipos de evento <span className="text-gray-400 font-normal">(ninguno = todos)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {eventTypes.map(et => (
                      <button
                        key={et.id}
                        type="button"
                        onClick={() => toggleEventType(et.id)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          form.event_type_ids.includes(et.id)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-600 hover:border-blue-400'
                        }`}
                      >
                        {et.name}
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
                        onClick={() => toggleParticipantType(pt)}
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

        {reviewing && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="font-semibold text-gray-900">Aprobar propuesta: {reviewing.title}</h2>
                <button onClick={() => setReviewing(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {reviewing.description && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{reviewing.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  Asigna metadatos del catálogo antes de publicar (no se heredan automáticamente del evento origen).
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipos de evento <span className="text-gray-400 font-normal">(ninguno = todos)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {eventTypes.map(et => (
                      <button
                        key={et.id}
                        type="button"
                        onClick={() => setReviewEventTypeIds(prev =>
                          prev.includes(et.id) ? prev.filter(v => v !== et.id) : [...prev, et.id]
                        )}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          reviewEventTypeIds.includes(et.id)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-600 hover:border-blue-400'
                        }`}
                      >
                        {et.name}
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
                        onClick={() => setReviewParticipantTypes(prev =>
                          prev.includes(pt) ? prev.filter(v => v !== pt) : [...prev, pt]
                        )}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          reviewParticipantTypes.includes(pt)
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
                    value={reviewTags}
                    onChange={e => setReviewTags(e.target.value)}
                    placeholder="musica, baile, grupal"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setReviewing(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                  Cancelar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={reviewing_}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> {reviewing_ ? 'Publicando...' : 'Publicar en el catálogo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
