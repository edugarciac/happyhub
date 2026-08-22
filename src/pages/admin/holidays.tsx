import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Lock } from 'lucide-react';

interface Holiday {
  id: number;
  holiday_date: string;
  name: string;
  source: 'seed' | 'custom';
  blocked: boolean;
  created_by: string | null;
  created_at: string;
}

interface FormData {
  holiday_date: string;
  name: string;
}

const emptyForm: FormData = { holiday_date: '', name: '' };

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/holidays');
      const data = await res.json();
      if (data.success) setHolidays(data.holidays);
    } catch {
      toast.error('Error al cargar los festivos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const openCreate = () => { setForm(emptyForm); setFormError(''); setShowCreateModal(true); };
  const openEdit = (h: Holiday) => {
    setForm({ holiday_date: h.holiday_date, name: h.name });
    setFormError(''); setEditingHoliday(h);
  };
  const closeModals = () => { setShowCreateModal(false); setEditingHoliday(null); setDeletingHoliday(null); setFormError(''); };

  const validate = (): string | null => {
    if (!form.holiday_date) return 'La fecha es obligatoria';
    if (!form.name.trim()) return 'El nombre es obligatorio';
    return null;
  };

  const handleCreate = async () => {
    const validationError = validate();
    if (validationError) { setFormError(validationError); return; }
    setSaving(true); setFormError('');
    try {
      const res = await fetch('/api/admin/holidays', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Error'); setSaving(false); return; }
      toast.success('Festivo creado'); closeModals(); fetchHolidays();
    } catch { setFormError('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editingHoliday) return;
    const validationError = validate();
    if (validationError) { setFormError(validationError); return; }
    setSaving(true); setFormError('');
    try {
      const res = await fetch(`/api/admin/holidays/${editingHoliday.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Error'); setSaving(false); return; }
      toast.success('Festivo actualizado'); closeModals(); fetchHolidays();
    } catch { setFormError('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingHoliday) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/holidays/${deletingHoliday.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error'); closeModals(); setSaving(false); return; }
      toast.success('Festivo eliminado'); closeModals(); fetchHolidays();
    } catch { toast.error('Error de conexión'); }
    finally { setSaving(false); }
  };

  const toggleBlocked = async (h: Holiday) => {
    setTogglingId(h.id);
    try {
      const res = await fetch(`/api/admin/holidays/${h.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !h.blocked }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error'); return; }
      toast.success(!h.blocked ? 'Festivo bloqueado: no se podrá reservar' : 'Festivo desbloqueado: vuelve a aplicar precio de festivo');
      fetchHolidays();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setTogglingId(null);
    }
  };

  const HolidayFormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha <span className="text-red-500">*</span></label>
        <input type="date" value={form.holiday_date} onChange={(e) => setForm({ ...form, holiday_date: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Ej: Festa local" />
      </div>
    </div>
  );

  return (
    <>
      <Head><title>Festivos - Admin HappyHub</title></Head>
      <Toaster position="top-right" />

      <AdminLayout>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Festivos</h1>
              <p className="text-gray-600">
                Días con precio de festivo en las reservas. Precargado con el calendario oficial de Esplugues de Llobregat —
                revisa y ajusta según necesites. Bloquear un festivo lo hace no reservable en lugar de aplicarle precio de festivo.
              </p>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl shadow hover:bg-primary-700 transition-colors font-medium text-sm shrink-0">
              <Plus className="w-4 h-4" /> Nuevo Festivo
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : holidays.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No hay festivos configurados</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Nombre</th>
                      <th className="px-4 py-3 font-medium">Origen</th>
                      <th className="px-4 py-3 font-medium">Bloqueado</th>
                      <th className="px-4 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {holidays.map((h) => (
                      <tr key={h.id} className={h.blocked ? 'bg-red-50/40' : ''}>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{formatDate(h.holiday_date)}</td>
                        <td className="px-4 py-3 text-gray-700">{h.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            h.source === 'seed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {h.source === 'seed' ? 'Calendario oficial' : 'Añadido a mano'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleBlocked(h)}
                            disabled={togglingId === h.id}
                            title={h.blocked ? 'Bloqueado: no se puede reservar' : 'Desbloqueado: precio de festivo'}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${h.blocked ? 'bg-red-500' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${h.blocked ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          {h.blocked && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600 align-middle">
                              <Lock className="w-3 h-3" /> No reservable
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(h)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => setDeletingHoliday(h)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Nuevo Festivo</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
              <HolidayFormFields />
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
        {editingHoliday && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Editar Festivo</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
              <HolidayFormFields />
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
        {deletingHoliday && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar festivo</h3>
              <p className="text-gray-600 text-sm mb-6">
                ¿Eliminar "{deletingHoliday.name}" ({formatDate(deletingHoliday.holiday_date)})?
                {deletingHoliday.blocked && ' También se desbloqueará la fecha para reservas.'} Esta acción no se puede deshacer.
              </p>
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
