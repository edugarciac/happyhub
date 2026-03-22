import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Search, Filter, ChevronLeft, ChevronRight, RefreshCw, Calendar,
  Users, Mail, Phone, MessageCircle, Pencil, Trash2, Plus, X,
} from 'lucide-react';
import {
  ReservationStatus, STATUS_LABELS, STATUS_COLORS,
  TRANSITION_LABELS, getAvailableTransitions,
} from '@/utils/reservationStatus';
import { buildWhatsAppUrl } from '@/utils/phone';

interface EventTypeOption { id: number; name: string; icon: string; }

interface Reservation {
  id: number;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  timeSlot: string;
  guests: number;
  totalPrice: number;
  depositAmount: number;
  depositPaid: boolean;
  status: ReservationStatus;
  notes: string;
  rejectionReason: string;
  cancellationReason: string;
  createdAt: string;
  updatedAt: string;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (11:00-14:30)',
  afternoon: 'Tarde (16:30-20:30)',
  night: 'Noche (22:00-02:00)',
};

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState<EventTypeOption[]>([]);

  useEffect(() => {
    fetch('/api/event-types').then(r => r.json()).then(d => {
      if (d.success) setEventTypes(d.eventTypes);
    }).catch(() => {});
  }, []);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Edit modal
  const [editReservation, setEditReservation] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState({ eventDate: '', timeSlot: '', eventType: '', guests: 0, totalPrice: 0, depositAmount: 0, notes: '' });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Status change modal
  const [statusModal, setStatusModal] = useState<{ reservation: Reservation; newStatus: ReservationStatus } | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Delete dialog
  const [deleteReservation, setDeleteReservation] = useState<Reservation | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString(), status });
      if (search) params.append('search', search);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/admin/reservations?${params}`);
      if (!response.ok) throw new Error('Error al cargar reservas');
      const data = await response.json();
      setReservations(data.reservations || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [offset, status, search, dateFrom, dateTo]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (reservation: Reservation, newStatus: ReservationStatus, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/reservations/${reservation.id}/status`, {
        method: 'PATCH', headers: jsonHeaders(),
        body: JSON.stringify({ status: newStatus, cancellationReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Error al cambiar estado', 'error'); return; }
      if (data.warning) {
        showToast(data.warning, 'error');
      } else {
        showToast(`Estado cambiado a ${STATUS_LABELS[newStatus]}`, 'success');
      }
      setStatusModal(null);
      setCancellationReason('');
      fetchReservations();
    } catch { showToast('Error de conexión', 'error'); }
  };

  const openEdit = (r: Reservation) => {
    setEditReservation(r);
    setEditForm({
      eventDate: r.eventDate ? r.eventDate.split('T')[0] : '',
      timeSlot: r.timeSlot, eventType: r.eventType, guests: r.guests,
      totalPrice: r.totalPrice, depositAmount: r.depositAmount, notes: r.notes,
    });
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editReservation) return;
    setEditSaving(true); setEditError('');
    if (editForm.guests < 1 || editForm.guests > 150) { setEditError('Invitados debe ser entre 1 y 150'); setEditSaving(false); return; }
    try {
      const res = await fetch(`/api/admin/reservations/${editReservation.id}`, {
        method: 'PATCH', headers: jsonHeaders(), body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || 'Error al guardar'); setEditSaving(false); return; }
      setEditReservation(null);
      showToast('Reserva actualizada', 'success');
      fetchReservations();
    } catch { setEditError('Error de conexión'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteReservation) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reservations/${deleteReservation.id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); showToast(data.error || 'Error al eliminar', 'error'); return; }
      showToast('Reserva eliminada', 'success');
      setDeleteReservation(null);
      fetchReservations();
    } catch { showToast('Error de conexión', 'error'); }
    finally { setDeleting(false); }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <>
      <Head><title>Reservas - Admin Happyhub</title></Head>

      <AdminLayout>
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-white text-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.message}
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reservas</h1>
              <p className="text-gray-600">{total} reservas encontradas</p>
            </div>
            <Link href="/admin/reservations/create" className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl shadow hover:bg-primary-700 transition-colors font-medium text-sm">
              <Plus className="w-4 h-4" /> Nueva Reserva
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow mb-6 p-4">
            <form onSubmit={(e) => { e.preventDefault(); setOffset(0); fetchReservations(); }} className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre, email, teléfono, ID..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select value={status} onChange={(e) => { setStatus(e.target.value); setOffset(0); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="all">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobada</option>
                  <option value="rejected">Rechazada</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="completed">Evento Realizado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm">
                <Filter className="w-4 h-4" /> Filtrar
              </button>
            </form>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

          {/* Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No se encontraron reservas</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones estado</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reservations.map((r) => {
                      const waUrl = buildWhatsAppUrl(r.phone);
                      const transitions = getAvailableTransitions(r.status);
                      const colors = STATUS_COLORS[r.status] || STATUS_COLORS.pending;

                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">#{r.id}</div>
                            <div className="text-xs text-gray-500">{formatDate(r.createdAt)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{r.name || '-'}</div>
                            {r.email && <div className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{r.email}</div>}
                            {r.phone && <div className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</div>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />{formatDate(r.eventDate)}
                            </div>
                            <div className="text-xs text-gray-500">{TIME_SLOT_LABELS[r.timeSlot] || r.timeSlot}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900 flex items-center gap-1">
                              <Users className="w-4 h-4 text-gray-400" />{r.guests} personas
                            </div>
                            <div className="text-xs text-gray-500">{r.eventType}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{r.totalPrice} EUR</div>
                            <div className="text-xs text-green-600">Señal: {r.depositAmount} EUR</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                              {STATUS_LABELS[r.status] || r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {transitions.map((t) => (
                                <button key={t} onClick={() => setStatusModal({ reservation: r, newStatus: t })}
                                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                                    t === 'approved' ? 'border-green-400 text-green-700 hover:bg-green-50' :
                                    t === 'rejected' || t === 'cancelled' ? 'border-red-400 text-red-700 hover:bg-red-50' :
                                    t === 'completed' ? 'border-blue-400 text-blue-700 hover:bg-blue-50' :
                                    t === 'pending' ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-50' :
                                    'border-gray-300 hover:bg-gray-100'
                                  }`}>
                                  {TRANSITION_LABELS[t]}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {waUrl && (
                                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="WhatsApp">
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                              )}
                              {r.email && (
                                <a href={`mailto:${r.email}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Email">
                                  <Mail className="w-4 h-4" />
                                </a>
                              )}
                              <button onClick={() => openEdit(r)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Editar">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeleteReservation(r)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && total > limit && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Mostrando {offset + 1} - {Math.min(offset + limit, total)} de {total}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Change Modal */}
        {statusModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setStatusModal(null); setCancellationReason(''); }}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {TRANSITION_LABELS[statusModal.newStatus]} reserva #{statusModal.reservation.id}
                </h3>
                <button onClick={() => { setStatusModal(null); setCancellationReason(''); }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                {statusModal.newStatus === 'approved' && '¿Confirmas que quieres aprobar esta reserva?'}
                {statusModal.newStatus === 'cancelled' && 'Indica el motivo de cancelación:'}
                {statusModal.newStatus === 'completed' && '¿Confirmas que el evento se ha realizado?'}
                {statusModal.newStatus === 'pending' && '¿Confirmas que quieres volver a poner esta reserva como pendiente?'}
                {statusModal.newStatus === 'rejected' && 'Indica el motivo de rechazo:'}
              </p>
              {statusModal.newStatus === 'cancelled' && (
                <textarea value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Motivo de cancelación (obligatorio)" rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              )}
              {statusModal.newStatus === 'rejected' && (
                <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Motivo de rechazo (obligatorio)" rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              )}
              <div className="flex gap-3">
                <button onClick={() => { setStatusModal(null); setCancellationReason(''); setRejectionReason(''); }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">Cancelar</button>
                <button onClick={() => {
                  if (statusModal.newStatus === 'cancelled' && !cancellationReason.trim()) { showToast('El motivo es obligatorio', 'error'); return; }
                  if (statusModal.newStatus === 'rejected' && !rejectionReason.trim()) { showToast('El motivo de rechazo es obligatorio', 'error'); return; }
                  const reason = statusModal.newStatus === 'rejected' ? rejectionReason : cancellationReason;
                  handleStatusChange(statusModal.reservation, statusModal.newStatus, reason || undefined);
                }} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editReservation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditReservation(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Editar reserva #{editReservation.id}</h3>
                <button onClick={() => setEditReservation(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {editError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{editError}</div>}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del evento</label>
                    <input type="date" value={editForm.eventDate} onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Franja horaria</label>
                    <select value={editForm.timeSlot} onChange={(e) => setEditForm({ ...editForm, timeSlot: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                      <option value="morning">Mañana</option><option value="afternoon">Tarde</option><option value="night">Noche</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de evento</label>
                    <select value={editForm.eventType} onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                      <option value="">Seleccionar tipo</option>
                      {eventTypes.map((t) => (
                        <option key={t.id} value={t.name}>{t.icon ? `${t.icon} ` : ''}{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invitados</label>
                    <input type="number" min="1" max="150" value={editForm.guests}
                      onChange={(e) => setEditForm({ ...editForm, guests: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio total (EUR)</label>
                    <input type="number" min="0" step="0.01" value={editForm.totalPrice}
                      onChange={(e) => setEditForm({ ...editForm, totalPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Señal (EUR)</label>
                    <input type="number" min="0" step="0.01" value={editForm.depositAmount}
                      onChange={(e) => setEditForm({ ...editForm, depositAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditReservation(null)} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">Cancelar</button>
                  <button onClick={handleEditSave} disabled={editSaving}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                    {editSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteReservation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteReservation(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar reserva</h3>
              <p className="text-gray-600 text-sm mb-1">Vas a eliminar la reserva #{deleteReservation.id} de {deleteReservation.name || deleteReservation.email || 'cliente'}.</p>
              <p className="text-red-600 text-xs mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteReservation(null)} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">Cancelar</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
