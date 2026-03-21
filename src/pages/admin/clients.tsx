import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import { apiClient } from '../../lib/apiClient';
import toast, { Toaster } from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react';

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

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 20;

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
      });
      const res = await apiClient.get(`/api/admin/clients?${params}`);
      if (res.data.success) {
        setClients(res.data.clients);
        setTotal(res.data.total);
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
            {!loading && (
              <div className="flex items-center gap-2 bg-white rounded-xl shadow px-4 py-3">
                <Users className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-semibold text-gray-700">{total} clientes</span>
              </div>
            )}
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
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Sí
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(client.created_at).toLocaleDateString('es-ES')}
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
    </>
  );
}
