import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Check, ChevronDown } from 'lucide-react';

interface EventType {
  id: number;
  name: string;
  description: string;
  icon: string;
  features: string[];
  active: boolean;
  sort_order: number;
}

interface FormData {
  name: string;
  description: string;
  icon: string;
  features: string[];
}

const emptyForm: FormData = { name: '', description: '', icon: '', features: [] };

interface EventTemplateMilestone {
  id: number;
  template_id: number;
  emoji: string | null;
  title: string;
  hito_type: string;
  phase: 'before' | 'during' | 'after';
  sort_order: number;
}

interface MilestoneForm {
  emoji: string;
  title: string;
  hito_type: string;
  phase: 'before' | 'during' | 'after';
}

const emptyMilestoneForm: MilestoneForm = { emoji: '', title: '', hito_type: '', phase: 'before' };

export default function AdminEventTypes() {
  const [types, setTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<EventType | null>(null);
  const [deletingType, setDeletingType] = useState<EventType | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [expandedTypeId, setExpandedTypeId] = useState<number | null>(null);
  const [milestonesCache, setMilestonesCache] = useState<Record<number, EventTemplateMilestone[]>>({});
  const [loadingMilestones, setLoadingMilestones] = useState<Record<number, boolean>>({});
  const [showMilestoneForm, setShowMilestoneForm] = useState<number | null>(null);
  const [milestoneForm, setMilestoneForm] = useState<MilestoneForm>(emptyMilestoneForm);
  const [savingMilestone, setSavingMilestone] = useState(false);

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/event-types');
      const data = await res.json();
      if (data.success) {
        setTypes(data.eventTypes.map((t: any) => ({
          ...t,
          features: typeof t.features === 'string' ? JSON.parse(t.features) : (t.features || []),
        })));
      }
    } catch { toast.error('Error al cargar tipos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const openCreate = () => { setForm(emptyForm); setNewFeature(''); setFormError(''); setShowCreateModal(true); };
  const openEdit = (t: EventType) => {
    setForm({ name: t.name, description: t.description || '', icon: t.icon || '', features: [...t.features] });
    setNewFeature(''); setFormError(''); setEditingType(t);
  };
  const closeModals = () => { setShowCreateModal(false); setEditingType(null); setDeletingType(null); setFormError(''); };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setForm({ ...form, features: [...form.features, newFeature.trim()] });
    setNewFeature('');
  };
  const removeFeature = (idx: number) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setFormError('El nombre es obligatorio'); return; }
    setSaving(true); setFormError('');
    try {
      const res = await fetch('/api/admin/event-types', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Error'); setSaving(false); return; }
      toast.success('Tipo creado'); closeModals(); fetchTypes();
    } catch { setFormError('Error de conexion'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editingType) return;
    setSaving(true); setFormError('');
    try {
      const res = await fetch(`/api/admin/event-types/${editingType.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Error'); setSaving(false); return; }
      toast.success('Tipo actualizado'); closeModals(); fetchTypes();
    } catch { setFormError('Error de conexion'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingType) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/event-types/${deletingType.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error'); closeModals(); setSaving(false); return; }
      toast.success('Tipo eliminado'); closeModals(); fetchTypes();
    } catch { toast.error('Error de conexion'); }
    finally { setSaving(false); }
  };

  const toggleExpand = async (t: EventType) => {
    if (expandedTypeId === t.id) {
      setExpandedTypeId(null);
      setShowMilestoneForm(null);
      return;
    }
    setExpandedTypeId(t.id);
    if (milestonesCache[t.id] !== undefined) return;
    setLoadingMilestones((prev) => ({ ...prev, [t.id]: true }));
    try {
      const res = await fetch(`/api/admin/event-types/${t.id}/milestones`);
      const data = await res.json();
      if (res.ok) setMilestonesCache((prev) => ({ ...prev, [t.id]: data.milestones }));
      else toast.error('Error al cargar hitos');
    } catch { toast.error('Error de conexión'); }
    finally { setLoadingMilestones((prev) => ({ ...prev, [t.id]: false })); }
  };

  const handleAddMilestone = async (t: EventType) => {
    if (!milestoneForm.title.trim() || !milestoneForm.hito_type.trim()) return;
    setSavingMilestone(true);
    try {
      const res = await fetch('/api/admin/event-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_milestone',
          event_type_name: t.name,
          emoji: milestoneForm.emoji || null,
          title: milestoneForm.title,
          hito_type: milestoneForm.hito_type,
          phase: milestoneForm.phase,
          sort_order: milestonesCache[t.id]?.length ?? 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMilestonesCache((prev) => ({ ...prev, [t.id]: [...(prev[t.id] || []), data.milestone] }));
        setMilestoneForm(emptyMilestoneForm);
        setShowMilestoneForm(null);
        toast.success('Hito añadido');
      } else {
        toast.error(data.error || 'Error al añadir hito');
      }
    } catch { toast.error('Error de conexión'); }
    finally { setSavingMilestone(false); }
  };

  const handleDeleteMilestone = async (typeId: number, milestoneId: number) => {
    if (!confirm('¿Eliminar este hito?')) return;
    try {
      const res = await fetch('/api/admin/event-templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'milestone', id: milestoneId }),
      });
      if (res.ok) {
        setMilestonesCache((prev) => ({
          ...prev,
          [typeId]: (prev[typeId] || []).filter((m) => m.id !== milestoneId),
        }));
        toast.success('Hito eliminado');
      } else {
        toast.error('Error al eliminar hito');
      }
    } catch { toast.error('Error de conexión'); }
  };

  const toggleActive = async (t: EventType) => {
    try {
      await fetch(`/api/admin/event-types/${t.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !t.active }),
      });
      fetchTypes();
    } catch { toast.error('Error'); }
  };

  const FormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Ej: Cumpleanos" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Icono (emoji)</label>
        <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Ej: 🎂" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Caracteristicas</label>
        <div className="space-y-2 mb-2">
          {form.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary-600 shrink-0" />
              <span className="text-sm text-gray-700 flex-1">{f}</span>
              <button type="button" onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" placeholder="Nueva caracteristica" />
          <button type="button" onClick={addFeature} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">Anadir</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Head><title>Tipos de Eventos - Admin</title></Head>
      <Toaster position="top-right" />

      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tipos de Eventos</h1>
              <p className="text-gray-600">Gestiona los tipos de eventos disponibles para reservar</p>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl shadow hover:bg-primary-700 transition-colors font-medium text-sm">
              <Plus className="w-4 h-4" /> Nuevo Tipo
            </button>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : types.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No hay tipos de eventos</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icono</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripcion</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caracteristicas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {types.map((t) => (
                    <React.Fragment key={t.id}>
                    <tr className={`hover:bg-gray-50 ${!t.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-2xl">{t.icon || '🎉'}</td>
                      <td className="px-4 py-3"><div className="text-sm font-medium text-gray-900">{t.name}</div></td>
                      <td className="px-4 py-3"><div className="text-sm text-gray-600 max-w-xs truncate">{t.description || '-'}</div></td>
                      <td className="px-4 py-3"><div className="text-xs text-gray-500">{t.features.length} items</div></td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(t)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${t.active ? 'bg-primary-600' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${t.active ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleExpand(t)}
                          title="Hitos de plantilla"
                          className={`p-1.5 rounded-lg transition-colors mr-1 ${expandedTypeId === t.id ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'}`}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${expandedTypeId === t.id ? 'rotate-180' : ''}`} />
                        </button>
                        <button onClick={() => openEdit(t)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeletingType(t)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                    {expandedTypeId === t.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-gray-50 border-b border-gray-200">
                          {loadingMilestones[t.id] ? (
                            <p className="text-sm text-gray-400 py-2">Cargando hitos...</p>
                          ) : (
                            <div>
                              {(milestonesCache[t.id] || []).length === 0 ? (
                                <p className="text-sm text-gray-400 mb-3">Sin hitos de plantilla. Añade el primero.</p>
                              ) : (
                                <div className="flex flex-col gap-1 mb-3">
                                  {(['before', 'during', 'after'] as const).map((phase) => {
                                    const phaseMs = (milestonesCache[t.id] || []).filter((m) => m.phase === phase);
                                    if (phaseMs.length === 0) return null;
                                    const phaseLabel = { before: 'Antes', during: 'Durante', after: 'Después' }[phase];
                                    return (
                                      <div key={phase} className="mb-2">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{phaseLabel}</p>
                                        <div className="flex flex-wrap gap-2">
                                          {phaseMs.map((m) => (
                                            <span key={m.id} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700">
                                              {m.emoji && <span>{m.emoji}</span>}
                                              <span className="font-medium">{m.title}</span>
                                              <span className="text-gray-400">·</span>
                                              <span className="text-gray-400 font-mono">{m.hito_type}</span>
                                              <button
                                                onClick={() => handleDeleteMilestone(t.id, m.id)}
                                                className="ml-1 text-gray-300 hover:text-red-400 transition-colors"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {showMilestoneForm !== t.id ? (
                                <button
                                  onClick={() => { setShowMilestoneForm(t.id); setMilestoneForm(emptyMilestoneForm); }}
                                  className="text-xs text-primary-600 border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                >
                                  + Añadir hito
                                </button>
                              ) : (
                                <div className="bg-white border border-gray-200 rounded-xl p-3 mt-2">
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    <input
                                      placeholder="Emoji"
                                      value={milestoneForm.emoji}
                                      onChange={(e) => setMilestoneForm({ ...milestoneForm, emoji: e.target.value })}
                                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-primary-400"
                                    />
                                    <input
                                      placeholder="Título *"
                                      value={milestoneForm.title}
                                      onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-32 focus:outline-none focus:ring-2 focus:ring-primary-400"
                                    />
                                    <input
                                      placeholder="hito_type * (ej: invitations)"
                                      value={milestoneForm.hito_type}
                                      onChange={(e) => setMilestoneForm({ ...milestoneForm, hito_type: e.target.value })}
                                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-32 font-mono focus:outline-none focus:ring-2 focus:ring-primary-400"
                                    />
                                    <select
                                      value={milestoneForm.phase}
                                      onChange={(e) => setMilestoneForm({ ...milestoneForm, phase: e.target.value as 'before' | 'during' | 'after' })}
                                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                                    >
                                      <option value="before">Antes</option>
                                      <option value="during">Durante</option>
                                      <option value="after">Después</option>
                                    </select>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setShowMilestoneForm(null)}
                                      className="text-xs text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => handleAddMilestone(t)}
                                      disabled={!milestoneForm.title.trim() || !milestoneForm.hito_type.trim() || savingMilestone}
                                      className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
                                    >
                                      {savingMilestone ? '...' : 'Añadir'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Nuevo Tipo de Evento</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
              {FormFields()}
              <div className="flex gap-3 mt-6">
                <button onClick={closeModals} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">Cancelar</button>
                <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                  {saving ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingType && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Editar Tipo de Evento</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
              {FormFields()}
              <div className="flex gap-3 mt-6">
                <button onClick={closeModals} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">Cancelar</button>
                <button onClick={handleUpdate} disabled={saving} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deletingType && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar tipo de evento</h3>
              <p className="text-gray-600 text-sm mb-1">Eliminar &quot;{deletingType.name}&quot;?</p>
              <p className="text-red-600 text-xs mb-6">Las reservas existentes mantendran el tipo actual.</p>
              <div className="flex gap-3">
                <button onClick={closeModals} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">Cancelar</button>
                <button onClick={handleDelete} disabled={saving} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                  {saving ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
