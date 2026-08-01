import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface Service {
  id: number;
  title: string;
  price: number | null;
  description: string;
  features: string[];
  image_url: string | null;
  active: boolean;
  sort_order: number;
}

interface FormData {
  title: string;
  price: string;
  description: string;
  features: string[];
  image_url: string | null;
  sort_order: number;
}

const emptyForm: FormData = { title: '', price: '', description: '', features: [], image_url: null, sort_order: 0 };

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/services?all=true');
      const data = await res.json();
      if (data.success) {
        setServices(data.services.map((s: any) => ({
          ...s,
          price: s.price !== null && s.price !== undefined ? parseFloat(s.price) : null,
          features: typeof s.features === 'string' ? JSON.parse(s.features) : (s.features || []),
        })));
      }
    } catch { toast.error('Error al cargar servicios'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openCreate = () => { setForm(emptyForm); setNewFeature(''); setFormError(''); setShowCreateModal(true); };
  const openEdit = (s: Service) => {
    setForm({
      title: s.title, price: s.price !== null ? s.price.toString() : '',
      description: s.description || '', features: [...s.features],
      image_url: s.image_url, sort_order: s.sort_order,
    });
    setNewFeature(''); setFormError(''); setEditingService(s);
  };
  const closeModals = () => { setShowCreateModal(false); setEditingService(null); setDeletingService(null); setFormError(''); };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setForm({ ...form, features: [...form.features, newFeature.trim()] });
    setNewFeature('');
  };
  const removeFeature = (idx: number) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { setFormError('El título es obligatorio'); return; }
    setSaving(true); setFormError('');
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: form.price || null }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Error'); setSaving(false); return; }
      toast.success('Servicio creado'); closeModals(); fetchServices();
    } catch { setFormError('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editingService) return;
    setSaving(true); setFormError('');
    try {
      const res = await fetch(`/api/admin/services/${editingService.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: form.price || null }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Error'); setSaving(false); return; }
      toast.success('Servicio actualizado'); closeModals(); fetchServices();
    } catch { setFormError('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${deletingService.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error'); closeModals(); setSaving(false); return; }
      toast.success('Servicio eliminado'); closeModals(); fetchServices();
    } catch { toast.error('Error de conexión'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (s: Service) => {
    try {
      await fetch(`/api/admin/services/${s.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !s.active }),
      });
      fetchServices();
    } catch { toast.error('Error'); }
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined || !Number.isFinite(price)) return 'Precio a consultar';
    return `${price.toFixed(2)} €`;
  };

  const ServiceFormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título <span className="text-red-500">*</span></label>
        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Ej: Catering" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Precio (€) <span className="text-gray-400 font-normal">dejar vacío = "Precio a consultar"</span></label>
        <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Dejar vacío para 'Precio a consultar'" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
        <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="services" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Características</label>
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
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" placeholder="Nueva característica" />
          <button type="button" onClick={addFeature} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">Añadir</button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
        <input type="number" min="0" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
      </div>
    </div>
  );

  return (
    <>
      <Head><title>Servicios - Admin</title></Head>
      <Toaster position="top-right" />

      <AdminLayout>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Servicios</h1>
              <p className="text-gray-600">Gestiona los servicios que aparecen en la página pública</p>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl shadow hover:bg-primary-700 transition-colors font-medium text-sm">
              <Plus className="w-4 h-4" /> Nuevo Servicio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center h-40">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : services.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">No hay servicios</div>
            ) : services.map((s) => (
              <div key={s.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${!s.active ? 'opacity-50' : ''}`}>
                {s.image_url && (
                  <div className="relative h-40 bg-gray-100">
                    <Image src={s.image_url} alt={s.title} fill className="object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                  <p className="text-primary-600 font-semibold text-sm mb-2">{formatPrice(s.price)}</p>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{s.description || '-'}</p>
                  <div className="text-xs text-gray-500 mb-3">{s.features.length} características</div>
                  <div className="flex items-center justify-between">
                    <button onClick={() => toggleActive(s)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.active ? 'bg-primary-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${s.active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeletingService(s)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Nuevo Servicio</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
              {ServiceFormFields()}
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
        {editingService && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Editar Servicio</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
              {ServiceFormFields()}
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
        {deletingService && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar servicio</h3>
              <p className="text-gray-600 text-sm mb-1">¿Eliminar "{deletingService.title}"?</p>
              <p className="text-red-600 text-xs mb-6">Se eliminará también la imagen asociada.</p>
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
