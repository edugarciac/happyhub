import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import StarRating from '../../components/StarRating';
// API calls use fetch with session cookies (no Bearer token needed)
import toast, { Toaster } from 'react-hot-toast';
import { Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';

type ReviewStatus = 'pending_review' | 'published' | 'archived' | 'cancelled';

interface Review {
  id: number;
  title: string;
  customer_name: string;
  rating: number;
  review_text: string;
  status: ReviewStatus;
  created_at: string;
}

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending_review: 'En revisión',
  published: 'Publicada',
  archived: 'Archivada',
  cancelled: 'Cancelada',
};

const STATUS_BADGE: Record<ReviewStatus, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<Review | null>(null);

  const limit = 20;

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        ...(filterStatus !== 'all' && { status: filterStatus }),
      });
      const response = await fetch(`/api/admin/reviews?${params}`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
        setTotal(data.total);
      }
    } catch {
      toast.error('Error al cargar reseñas');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleStatusChange = async (review: Review, newStatus: ReviewStatus) => {
    try {
      const response = await fetch(`/api/reviews/${review.id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error();
      toast.success(`Reseña ${STATUS_LABELS[newStatus].toLowerCase()}`);
      fetchReviews();
    } catch {
      toast.error('Error al actualizar reseña');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const response = await fetch(`/api/admin/reviews?id=${deleteConfirm.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      toast.success('Reseña eliminada');
      setDeleteConfirm(null);
      fetchReviews();
    } catch {
      toast.error('Error al eliminar reseña');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Head>
        <title>Gestión de Reseñas - Admin</title>
      </Head>

      <Toaster position="top-right" />

      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Reseñas</h1>
            <p className="text-gray-600">Modera y gestiona las valoraciones de clientes</p>
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
                  placeholder="Buscar por cliente o comentario..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Todas</option>
                <option value="pending_review">En revisión</option>
                <option value="published">Publicada</option>
                <option value="archived">Archivada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No se encontraron reseñas</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valoración</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comentario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 max-w-[150px] truncate" title={review.title || ''}>
                            {review.title || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{review.customer_name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StarRating rating={review.rating} readonly size="sm" />
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="text-sm text-gray-600 max-w-xs truncate"
                            title={review.review_text || ''}
                          >
                            {review.review_text || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[review.status]}`}>
                            {STATUS_LABELS[review.status] || review.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(review.created_at).toLocaleDateString('es-ES')}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {review.status === 'pending_review' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(review, 'published')}
                                  className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                >
                                  Publicar
                                </button>
                                <button
                                  onClick={() => handleStatusChange(review, 'cancelled')}
                                  className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                            {review.status === 'published' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(review, 'archived')}
                                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                  Archivar
                                </button>
                                <button
                                  onClick={() => handleStatusChange(review, 'cancelled')}
                                  className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                            {review.status === 'archived' && (
                              <button
                                onClick={() => handleStatusChange(review, 'published')}
                                className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                              >
                                Publicar
                              </button>
                            )}
                            {review.status === 'cancelled' && (
                              <button
                                onClick={() => handleStatusChange(review, 'pending_review')}
                                className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                              >
                                Reabrir
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirm(review)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
      </AdminLayout>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Eliminar Reseña"
        message={`¿Estás seguro de eliminar la reseña de ${deleteConfirm?.customer_name}?\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </>
  );
}
