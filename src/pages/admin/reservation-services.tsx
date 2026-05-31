import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X } from 'lucide-react';

type ServiceStatus = 'requested' | 'confirmed' | 'cancelled' | 'completed';

interface ReservationService {
  id: number;
  service_name: string;
  service_type: string | null;
  reservation_id: number | null;
  partner_id: number | null;
  price: string | null;
  status: ServiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  partner_name: string | null;
  event_date: string | null;
  reservation_status: string | null;
}

interface ServiceForm {
  service_name: string;
  service_type: string;
  reservation_id: string;
  partner_id: string;
  price: string;
  status: ServiceStatus;
  notes: string;
}

const emptyForm: ServiceForm = {
  service_name: '',
  service_type: '',
  reservation_id: '',
  partner_id: '',
  price: '',
  status: 'requested',
  notes: '',
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  requested: 'Solicitado',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
};

const STATUS_BADGE: Record<ServiceStatus, string> = {
  requested: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

export default function AdminReservationServices() {
  const [services, setServices] = useState<ReservationService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState<ReservationService | null>(null);
  const [deletingService, setDeletingService] = useState<ReservationService | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const limit = 20;

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
      });
      if (filterStatus !== 'all') params.append('status', filterStatus);
      const response = await fetch(`/api/admin/reservation-services?${params}`);
      const data = await response.json();
      if (data.success) {
        setServices(data.services);
        setTotal(data.total);
      }
    } catch {
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const totalPages = Math.ceil(total / limit);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    setShowCreateModal(true);
  };

  const openEdit = (service: ReservationService) => {
    setForm({
      service_name: service.service_name || '',
      service_type: service.service_type || '',
      reservation_id: service.reservation_id ? String(service.reservation_id) : '',
      partner_id: service.partner_id ? String(service.partner_id) : '',
      price: service.price !== null && service.price !== undefined ? String(service.price) : '',
      status: service.status,
      notes: service.notes || '',
    });
    setFormError('');
    setEditingService(service);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingService(null);
    setDeletingService(null);
    setFormError('');
  };

  const handleCreate = async () => {
    if (!form.service_name.trim()) {
      setFormError('El nombre del servicio es obligatorio');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch('/api/admin/reservation-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: form.service_name,
          service_type: form.service_type || undefined,
          reservation_id: form.reservation_id || undefined,
          partner_id: form.partner_id || undefined,
          price: form.price || undefined,
          status: form.status,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Error al crear servicio');
        setSaving(false);
        return;
      }
      toast.success('Servicio creado');
      closeModals();
      fetchServices();
    } catch {
      setFormError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingService) return;
    if (!form.service_name.trim()) {
      setFormError('El nombre del servicio es obligatorio');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch(`/api/admin/reservation-services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: form.service_name,
          service_type: form.service_type || null,
          reservation_id: form.reservation_id || null,
          partner_id: form.partner_id || null,
          price: form.price !== '' ? form.price : null,
          status: form.status,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Error al actualizar servicio');
        setSaving(false);
        return;
      }
      toast.success('Servicio actualizado');
      closeModals();
      fetchServices();
    } catch {
      setFormError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reservation-services/${deletingService.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Error al eliminar servicio');
        setSaving(false);
        closeModals();
        return;
      }
      toast.success('Servicio eliminado');
      closeModals();
      fetchServices();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const isFormModal = showCreateModal || editingService !== null;

  return (
    <>
      <Head>
        <title>Servicios de Reservas | Admin HappyHub</title>
      </Head>

      <Toaster position="top-right" />

      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Servicios de Reservas</h1>
              <p className="text-gray-600">Gestiona los servicios vinculados a reservas y partners</p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl shadow hover:bg-primary-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo Servicio
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Buscar por nombre o tipo..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="requested">Solicitado</option>
                <option value="confirmed">Confirmado</option>
                <option value="cancelled">Cancelado</option>
                <option value="completed">Completado</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No se encontraron servicios</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reserva</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">#{service.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{service.service_name}</div>
                          {service.service_type && (
                            <div className="text-xs text-gray-500">{service.service_type}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{service.partner_name || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {service.event_date
                              ? new Date(service.event_date).toLocaleDateString('es-ES')
                              : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {service.price !== null && service.price !== undefined
                              ? `${parseFloat(service.price).toFixed(2)} €`
                              : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[service.status]}`}>
                            {STATUS_LABELS[service.status] || service.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => openEdit(service)}
                            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingService(service)}
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
                  <span className="text-sm text-gray-600">{page} / {totalPages}</span>
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

        {/* Create / Edit Modal */}
        {isFormModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {showCreateModal ? 'Nuevo Servicio' : 'Editar Servicio'}
                </h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del servicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.service_name}
                    onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                    placeholder="Ej: Catering, Fotografía..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de servicio</label>
                  <input
                    type="text"
                    value={form.service_type}
                    onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                    placeholder="Ej: catering, music, decoration..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Reserva</label>
                    <input
                      type="number"
                      value={form.reservation_id}
                      onChange={(e) => setForm({ ...form, reservation_id: e.target.value })}
                      placeholder="Opcional"
                      min={1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Partner</label>
                    <input
                      type="number"
                      value={form.partner_id}
                      onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
                      placeholder="Opcional"
                      min={1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio (€)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="Opcional"
                    min={0}
                    step={0.01}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ServiceStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="requested">Solicitado</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Notas adicionales..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={showCreateModal ? handleCreate : handleUpdate}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : showCreateModal ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingService && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Eliminar Servicio</h3>
                <button onClick={closeModals} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-1">
                ¿Estás seguro de eliminar el servicio <strong>{deletingService.service_name}</strong>?
              </p>
              <p className="text-red-600 text-xs mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
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
