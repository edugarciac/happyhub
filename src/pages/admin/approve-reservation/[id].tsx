import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { apiClient } from '../../../lib/apiClient';
import { CheckCircle, XCircle, Calendar, Users, Clock, CreditCard, User, Mail, Phone, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function ApproveReservationPage() {
  const router = useRouter();
  const { id } = router.query;

  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReservation();
    }
  }, [id]);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/admin/reservations/${id}`);
      if (response.data.success) {
        setReservation(response.data.reservation);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar la reserva');
      toast.error('Error al cargar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('¿Aprobar esta reserva?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiClient.post(`/api/admin/reservations/${id}/approve`);
      if (response.data.success) {
        toast.success('Reserva aprobada correctamente');
        setReservation(response.data.reservation);
        // Refresh to show updated status
        fetchReservation();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al aprobar la reserva');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('El motivo de rechazo es obligatorio');
      return;
    }

    if (!window.confirm('¿Rechazar esta reserva?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiClient.post(`/api/admin/reservations/${id}/reject`, {
        rejection_reason: rejectionReason,
      });
      if (response.data.success) {
        toast.success('Reserva rechazada');
        setReservation(response.data.reservation);
        setShowRejectForm(false);
        fetchReservation();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al rechazar la reserva');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'Reserva no encontrada'}</p>
        </div>
      </div>
    );
  }

  const isPending = reservation.status === 'pending';
  const isApproved = reservation.status === 'approved';
  const isRejected = reservation.status === 'rejected';

  const statusBadgeClasses: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  };

  return (
    <>
      <Head>
        <title>Aprobar Reserva #{id} - HappyHub Admin</title>
      </Head>

      <Toaster position="top-right" />

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Reserva #{reservation.id}
                </h1>
                <p className="text-gray-600 mt-1">
                  Creada el {new Date(reservation.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusBadgeClasses[reservation.status] || 'bg-gray-100 text-gray-800'}`}>
                {statusLabels[reservation.status] || reservation.status}
              </span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Información del Cliente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-semibold text-gray-900">{reservation.user_name || 'N/A'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href={`mailto:${reservation.user_email}`} className="font-semibold text-primary-600 hover:underline">
                    {reservation.user_email}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <a href={`https://wa.me/${reservation.user_phone?.replace(/\D/g, '')}`} className="font-semibold text-green-600 hover:underline">
                    {reservation.user_phone || 'N/A'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Detalles del Evento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Fecha</p>
                <p className="font-semibold text-gray-900 text-lg">
                  {new Date(reservation.event_date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Horario</p>
                <p className="font-semibold text-gray-900 text-lg flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-primary-600" />
                  {reservation.time_slot === 'morning' && 'Mañana (10:00-14:00)'}
                  {reservation.time_slot === 'afternoon' && 'Tarde (16:30-20:30)'}
                  {reservation.time_slot === 'night' && 'Noche (22:00-02:00)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tipo de Evento</p>
                <p className="font-semibold text-gray-900">{reservation.event_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Número de Invitados</p>
                <p className="font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary-600" />
                  {reservation.guests || 0} personas
                </p>
              </div>
            </div>
            {reservation.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Notas adicionales</p>
                <p className="text-gray-700">{reservation.notes}</p>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Precio
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Precio total</span>
                <span className="font-bold text-2xl text-gray-900">{reservation.total_price}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Depósito (30%)</span>
                <span className="font-semibold text-gray-700">{reservation.deposit_amount}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estado de pago</span>
                <span className={`font-semibold ${reservation.deposit_paid ? 'text-green-600' : 'text-yellow-600'}`}>
                  {reservation.deposit_paid ? 'Depósito pagado' : 'Pendiente de pago'}
                </span>
              </div>
            </div>
          </div>

          {/* Rejection Reason (if rejected) */}
          {isRejected && reservation.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-red-900 mb-2">Motivo de Rechazo</h3>
              <p className="text-red-800">{reservation.rejection_reason}</p>
              <p className="text-sm text-red-600 mt-2">
                Rechazada por {reservation.admin_approved_by}
              </p>
            </div>
          )}

          {/* Approval Info (if approved) */}
          {isApproved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">Reserva Aprobada</h3>
              <p className="text-green-800">
                Aprobada por {reservation.admin_approved_by} el{' '}
                {new Date(reservation.approved_at).toLocaleString('es-ES')}
              </p>
            </div>
          )}

          {/* Action Buttons (only for pending) */}
          {isPending && !showRejectForm && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex gap-4">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {actionLoading ? 'Procesando...' : 'Aprobar Reserva'}
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Rechazar
                </button>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {isPending && showRejectForm && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Motivo de Rechazo</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explica por qué se rechaza esta reserva..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
                rows={4}
                maxLength={500}
              />
              <div className="text-sm text-gray-600 mb-4">
                {rejectionReason.length}/500 caracteres
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Procesando...' : 'Confirmar Rechazo'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Already Processed Message */}
          {!isPending && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-700">
                Esta reserva ya fue procesada y no puede modificarse.
              </p>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="mt-4 btn-outline"
              >
                Volver al Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
