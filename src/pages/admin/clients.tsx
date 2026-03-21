import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight, Users, Plus, Pencil, Trash2, X } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'client';
  email_verified: boolean;
  created_at: string;
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  client: 'bg-blue-100 text-blue-800',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  client: 'Cliente',
};

interface ClientForm {
  name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
}

const emptyForm: ClientForm = { name: '', email: '', phone: '', role: 'client', password: '' };

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const limit = 20;

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
      });
      const response = await fetch(`/api/admin/clients?${params}`);
      const data = await response.json();
      if (data.success) {
        setClients(data.clients);
        setTotal(data.total);
      }
    } catch {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const totalPages = Math.ceil(total / limit);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    setShowCreateModal(true);
  };

  const openEdit = (client: Client) => {
    setForm({ name: client.name || '', email: client.email, phone: client.phone || '', role: client.role, password: '' });
    setFormError('');
    setEditingClient(client);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingClient(null);
    setDeletingClient(null);
    setFormError('');
  };

  const handleCreate = async () => {
    if (!form.email.trim()) { setFormError('El email es obligatorio'); return; }
    if (!form.password || form.password.length < 8) { setFormError('La contraseña debe tener al menos 8 caracteres'); return; }
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Error al crear'); setSaving(false); return; }
      toast.success('Cliente creado');
      closeModals();
      fetchClients();
    } catch {
      setFormError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingClient) return;
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch(`/api/admin/clients/${editingClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone, role: form.role }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Error al actualizar'); setSaving(false); return; }
      toast.success('Cliente actualizado');
      closeModals();
      fetchClients();
    } catch {
      setFormError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${deletingClient.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error al eliminar'); setSaving(false); closeModals(); return; }
      toast.success('Cliente eliminado');
      closeModals();
      fetchClients();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Clientes - Admin</title>
      </Head>

      <Toaster position="top-right" />

      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Clientes</h1>
              <p className="text-gray-600">Usuarios registrados en la plataforma</p>
            </div>
            <div className="flex items-center gap-3">
              {!loading && (
                <div className="flex items-center gap-2 bg-white rounded-xl shadow px-4 py-3">
                  <Users className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-semibold text-gray-700">{total} clientes</span>
                </div>
              )}
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl shadow hover:bg-primary-700 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Nuevo Cliente
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por nombre o email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No se encontraron clientes</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verificado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha registro</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{client.name || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{client.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{client.phone || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ROLE_BADGE[client.role] || ROLE_BADGE.client}`}>
                            {ROLE_LABELS[client.role] || client.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {client.email_verified ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Sí</span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(client.created_at).toLocaleDateString('es-ES')}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => openEdit(client)}
                            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingClient(client)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && total > limit && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Nuevo Cliente</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña <span className="text-red-500">*</span></label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="client">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>
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
        {editingClient && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Editar Cliente</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <div className="text-sm text-gray-900 px-3 py-2 bg-gray-50 rounded-lg">{editingClient.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="client">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>
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

        {/* Delete Confirmation Modal */}
        {deletingClient && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar cliente</h3>
              <p className="text-gray-600 text-sm mb-1">¿Estás seguro de eliminar a:</p>
              <p className="font-medium text-gray-900 mb-4">{deletingClient.name || deletingClient.email}</p>
              <p className="text-red-600 text-xs mb-6">Esta acción no se puede deshacer.</p>
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
