import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable, { Column } from '../../components/admin/DataTable';
import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { apiClient } from '../../lib/apiClient';
import toast, { Toaster } from 'react-hot-toast';
import StarRating from '../../components/StarRating';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPublished, setFilterPublished] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  const pageSize = 20;

  useEffect(() => {
    fetchReviews();
  }, [currentPage, search, filterPublished]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search,
        ...(filterPublished !== 'all' && { published: filterPublished }),
      });

      const response = await apiClient.get(`/api/admin/reviews?${params}`);
      if (response.data.success) {
        setReviews(response.data.reviews);
        setTotalRecords(response.data.total);
      }
    } catch (error: any) {
      toast.error('Error al cargar reseñas');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (review: any) => {
    try {
      await apiClient.patch(`/api/reviews/${review.id}/publish`);
      toast.success(review.is_published ? 'Reseña ocultada' : 'Reseña publicada');
      fetchReviews();
    } catch (error) {
      toast.error('Error al actualizar reseña');
    }
  };

  const handleDelete = async (review: any) => {
    setDeleteConfirm(review);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/api/admin/reviews?id=${deleteConfirm.id}`);
      toast.success('Reseña eliminada');
      setDeleteConfirm(null);
      fetchReviews();
    } catch (error) {
      toast.error('Error al eliminar reseña');
    }
  };

  const columns: Column[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'customer_name', label: 'Cliente', sortable: true },
    {
      key: 'rating',
      label: 'Valoración',
      render: (value) => <StarRating rating={value} readonly size="sm" />,
    },
    {
      key: 'review_text',
      label: 'Comentario',
      render: (value) => (
        <div className="max-w-xs truncate" title={value || ''}>
          {value || '-'}
        </div>
      ),
    },
    {
      key: 'is_published',
      label: 'Estado',
      render: (value) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {value ? 'Publicada' : 'Pendiente'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Fecha',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('es-ES'),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row: any) => (
        <button
          onClick={() => handleTogglePublish(row)}
          className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            row.is_published
              ? 'text-gray-700 hover:bg-gray-100'
              : 'text-green-700 hover:bg-green-50'
          }`}
          title={row.is_published ? 'Ocultar' : 'Publicar'}
        >
          {row.is_published ? (
            <>
              <EyeOff className="w-4 h-4" />
              Ocultar
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Publicar
            </>
          )}
        </button>
      ),
    },
  ];

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
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Buscar por cliente o comentario..."
              />
              <select
                value={filterPublished}
                onChange={(e) => setFilterPublished(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Todas</option>
                <option value="true">Publicadas</option>
                <option value="false">Pendientes</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <DataTable
            data={reviews}
            columns={columns}
            onDelete={handleDelete}
            loading={loading}
          />

          {/* Pagination */}
          {!loading && totalRecords > pageSize && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalRecords / pageSize)}
                onPageChange={setCurrentPage}
                totalRecords={totalRecords}
                pageSize={pageSize}
              />
            </div>
          )}

          {/* Delete Confirmation */}
          <ConfirmDialog
            isOpen={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={confirmDelete}
            title="Eliminar Reseña"
            message={`¿Estás seguro de eliminar la reseña de ${deleteConfirm?.customer_name}?\n\nEsta acción no se puede deshacer.`}
            confirmText="Eliminar"
            variant="danger"
          />
        </div>
      </AdminLayout>
    </>
  );
}
