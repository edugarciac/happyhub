import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, GripVertical } from 'lucide-react';

interface EventType {
  id: number;
  name: string;
  description: string;
  icon: string;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

interface FormData {
  name: string;
  description: string;
  icon: string;
}

const emptyForm: FormData = { name: '', description: '', icon: '' };

export default function AdminEventTypes() {
  const [types, setTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<EventType | null>(null);
  const [deletingType, setDeletingType] = useState<EventType | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/event-types');
      const data = await res.json();
      if (data.success) setTypes(data.eventTypes);
    } catch { toast.error('Error al cargar tipos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const openCreate = () => { setForm(emptyForm); setFormError(''); setShowCreateModal(true); };
  const openEdit = (t: EventType) => { setForm({ name: t.name, description: t.description || '', icon: t.icon || '' }); setFormError(''); setEditingType(t); };
  const closeModals = () => { setShowCreateModal(false); setEditingType(null); setDeletingType(null); setFormError(''); };

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
    } catch { setFormError('Error de conexión'); }
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
    } catch { setFormError('Error de conexión'); }
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
    } catch { toast.error('Error de conexión'); }
    finally { setSaving(false); }
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {types.map((t) => (
                    <tr key={t.id} className={`hover:bg-gray-50 ${!t.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-2xl">{t.icon || '🎉'}</td>
                      <td className="px-4 py-3"><div className="text-sm font-medium text-gray-900">{t.name}</div></td>
                      <td className="px-4 py-3"><div className="text-sm text-gray-600 max-w-xs truncate">{t.description || '-'}</div></td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(t)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${t.active ? 'bg-primary-600' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${t.active ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(t)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeletingType(t)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Nuevo Tipo de Evento</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Ej: Cumpleaños" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icono (emoji)</label>
                  <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Ej: 🎂" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
              </div>
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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Editar Tipo de Evento</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icono (emoji)</label>
                  <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
              </div>
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
              <p className="text-gray-600 text-sm mb-1">¿Eliminar "{deletingType.name}"?</p>
              <p className="text-red-600 text-xs mb-6">Las reservas existentes mantendrán el tipo actual.</p>
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
