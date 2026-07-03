import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import AdminLayout from '../../components/admin/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';
import { Search, Plus, Pencil, Trash2, X, Upload, Building2 } from 'lucide-react';

interface Partner {
  id: number;
  name: string;
  service_type: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  price_range: string | null;
  logo_url: string | null;
  website: string | null;
  active: boolean;
}

interface PartnerForm {
  name: string;
  service_type: string;
  email: string;
  phone: string;
  description: string;
  price_range: string;
  logo_url: string;
  website: string;
  active: boolean;
}

const emptyForm: PartnerForm = {
  name: '', service_type: '', email: '', phone: '',
  description: '', price_range: '', logo_url: '', website: '', active: true,
};

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/partners');
      if (res.ok) setPartners(await res.json());
    } catch (err) { console.warn('Failed to fetch partners:', err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const filtered = partners.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.service_type || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingPartner(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p: Partner) => {
    setEditingPartner(p);
    setForm({
      name: p.name,
      service_type: p.service_type || '',
      email: p.email || '',
      phone: p.phone || '',
      description: p.description || '',
      price_range: p.price_range || '',
      logo_url: p.logo_url || '',
      website: p.website || '',
      active: p.active,
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagen max 5MB'); return; }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const res = await fetch('/api/admin/upload-partner-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result, filename: form.name || 'partner' }),
        });
        if (res.ok) {
          const { url } = await res.json();
          setForm(prev => ({ ...prev, logo_url: url }));
          toast.success('Imagen subida');
        } else {
          toast.error('Error al subir imagen');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Error al subir imagen');
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.service_type) {
      toast.error('Nombre y tipo de servicio son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const method = editingPartner ? 'PUT' : 'POST';
      const body = editingPartner ? { ...form, id: editingPartner.id } : form;
      const res = await fetch('/api/admin/partners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editingPartner ? 'Partner actualizado' : 'Partner creado');
        setShowModal(false);
        fetchPartners();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al guardar');
      }
    } catch { toast.error('Error de conexion'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingPartner) return;
    try {
      const res = await fetch(`/api/admin/partners?id=${deletingPartner.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Partner eliminado');
        setDeletingPartner(null);
        fetchPartners();
      }
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <AdminLayout>
      <Head><title>Partners - Admin HappyHub</title></Head>
      <Toaster position="top-right" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6" /> Partners
          </h1>
          <p className="text-gray-500 text-sm">{partners.length} partners registrados</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Partner
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o tipo de servicio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay partners</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Imagen</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Telefono</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {p.logo_url ? (
                      <Image src={p.logo_url} alt={p.name} width={40} height={40} className="rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-gray-600">{p.service_type}</td>
                  <td className="px-6 py-4 text-gray-600">{p.phone || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${p.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(p)} className="p-2 text-gray-500 hover:text-primary-600 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingPartner(p)} className="p-2 text-gray-500 hover:text-red-600 transition-colors ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingPartner ? 'Editar Partner' : 'Nuevo Partner'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de servicio *</label>
                <input type="text" value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })}
                  placeholder="catering, fotografia, decoracion..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rango de precios</label>
                  <input type="text" value={form.price_range} onChange={e => setForm({ ...form, price_range: e.target.value })}
                    placeholder="200-600€"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                <div className="flex items-center gap-4">
                  {form.logo_url ? (
                    <Image src={form.logo_url} alt="Preview" width={64} height={64} className="rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                    {form.logo_url && (
                      <button type="button" onClick={() => setForm({ ...form, logo_url: '' })}
                        className="text-xs text-red-500 mt-1 hover:underline">Quitar imagen</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <label htmlFor="active" className="text-sm text-gray-700">Activo</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Guardando...' : editingPartner ? 'Guardar cambios' : 'Crear partner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeletingPartner(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm m-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Eliminar partner</h2>
            <p className="text-gray-600 mb-6">¿Seguro que quieres eliminar <strong>{deletingPartner.name}</strong>?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingPartner(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancelar
              </button>
              <button onClick={handleDelete} className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
