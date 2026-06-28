import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface PricingRule {
  id: number;
  rule_name: string;
  day_type: string;
  time_slot: string;
  price: string | number;
  description: string;
  effective_from: string | null;
  effective_to: string | null;
  active: boolean;
}

interface FormData {
  rule_name: string;
  day_type: string;
  time_slot: string;
  price: string;
  description: string;
  effective_from: string;
  effective_to: string;
}

const emptyForm: FormData = {
  rule_name: '', day_type: '', time_slot: '', price: '', description: '', effective_from: '', effective_to: '',
};

const DAY_TYPE_OPTIONS = ['weekday', 'friday', 'weekend', 'holiday'];
const TIME_SLOT_OPTIONS = ['morning', 'afternoon', 'night'];

export default function AdminPricing() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<PricingRule | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/pricing');
      const data = await res.json();
      if (data.success) setRules(data.rules);
    } catch { toast.error('Error al cargar los precios'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const openCreate = () => { setForm(emptyForm); setFormError(''); setShowCreateModal(true); };
  const openEdit = (r: PricingRule) => {
    setForm({
      rule_name: r.rule_name,
      day_type: r.day_type,
      time_slot: r.time_slot,
      price: String(r.price),
      description: r.description || '',
      effective_from: r.effective_from ? r.effective_from.slice(0, 10) : '',
      effective_to: r.effective_to ? r.effective_to.slice(0, 10) : '',
    });
    setFormError(''); setEditingRule(r);
  };
  const closeModals = () => { setShowCreateModal(false); setEditingRule(null); setDeletingRule(null); setFormError(''); };

  const validate = (): string | null => {
    if (!form.rule_name.trim()) return 'El nombre de la regla es obligatorio';
    if (!form.day_type.trim()) return 'El tipo de día es obligatorio';
    if (!form.time_slot.trim()) return 'La franja horaria es obligatoria';
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) return 'El precio debe ser un número mayor o igual a 0';
    return null;
  };

  const handleCreate = async () => {
    const validationError = validate();
    if (validationError) { setFormError(validationError); return; }
    setSaving(true); setFormError('');
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          effective_from: form.effective_from || null,
          effective_to: form.effective_to || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Error'); setSaving(false); return; }
      toast.success('Regla de precio creada'); closeModals(); fetchRules();
    } catch { setFormError('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editingRule) return;
    const validationError = validate();
    if (validationError) { setFormError(validationError); return; }
    setSaving(true); setFormError('');
    try {
      const res = await fetch(`/api/admin/pricing/${editingRule.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          effective_from: form.effective_from || null,
          effective_to: form.effective_to || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Error'); setSaving(false); return; }
      toast.success('Regla de precio actualizada'); closeModals(); fetchRules();
    } catch { setFormError('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pricing/${deletingRule.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error'); closeModals(); setSaving(false); return; }
      toast.success('Regla de precio eliminada'); closeModals(); fetchRules();
    } catch { toast.error('Error de conexión'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (r: PricingRule) => {
    try {
      const res = await fetch(`/api/admin/pricing/${r.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !r.active }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error'); return; }
      fetchRules();
    } catch { toast.error('Error de conexión'); }
  };

  const formatPrice = (price: string | number) => {
    const n = typeof price === 'string' ? parseFloat(price) : price;
    return n > 0 ? `${n.toFixed(2)} €` : 'A consultar';
  };

  const PricingFormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la regla <span className="text-red-500">*</span></label>
        <input type="text" value={form.rule_name} onChange={(e) => setForm({ ...form, rule_name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Ej: weekend_afternoon" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de día <span className="text-red-500">*</span></label>
          <select value={form.day_type} onChange={(e) => setForm({ ...form, day_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">Seleccionar</option>
            {DAY_TYPE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Franja horaria <span className="text-red-500">*</span></label>
          <select value={form.time_slot} onChange={(e) => setForm({ ...form, time_slot: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">Seleccionar</option>
            {TIME_SLOT_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Precio (€) <span className="text-gray-400 font-normal">0 = "A consultar"</span></label>
        <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="0.00" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vigente desde</label>
          <input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vigente hasta</label>
          <input type="date" value={form.effective_to} onChange={(e) => setForm({ ...form, effective_to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Head><title>Precios - Admin HappyHub</title></Head>
      <Toaster position="top-right" />

      <AdminLayout>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Precios</h1>
              <p className="text-gray-600">Gestiona las tarifas base del espacio. Los cambios tardan hasta 5 minutos en reflejarse en la web.</p>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl shadow hover:bg-primary-700 transition-colors font-medium text-sm shrink-0">
              <Plus className="w-4 h-4" /> Nueva Regla
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No hay reglas de precios</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Regla</th>
                      <th className="px-4 py-3 font-medium">Tipo de día</th>
                      <th className="px-4 py-3 font-medium">Franja</th>
                      <th className="px-4 py-3 font-medium">Precio</th>
                      <th className="px-4 py-3 font-medium">Vigencia</th>
                      <th className="px-4 py-3 font-medium">Activa</th>
                      <th className="px-4 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rules.map((r) => (
                      <tr key={r.id} className={!r.active ? 'opacity-50' : ''}>
                        <td className="px-4 py-3 font-medium text-gray-900">{r.rule_name}</td>
                        <td className="px-4 py-3 text-gray-600">{r.day_type}</td>
                        <td className="px-4 py-3 text-gray-600">{r.time_slot}</td>
                        <td className="px-4 py-3 font-semibold text-primary-600">{formatPrice(r.price)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {r.effective_from || r.effective_to
                            ? `${r.effective_from?.slice(0, 10) || '...'} → ${r.effective_to?.slice(0, 10) || '...'}`
                            : 'Sin límite'}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleActive(r)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${r.active ? 'bg-primary-600' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${r.active ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(r)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => setDeletingRule(r)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                <h3 className="text-lg font-bold text-gray-900">Nueva Regla de Precio</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
              <PricingFormFields />
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
        {editingRule && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Editar Regla de Precio</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
              <PricingFormFields />
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
        {deletingRule && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar regla de precio</h3>
              <p className="text-gray-600 text-sm mb-6">¿Eliminar "{deletingRule.rule_name}"? Esta acción no se puede deshacer.</p>
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
