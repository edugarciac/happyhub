import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  FileText,
  Settings,
  Download,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface Stats {
  currentMonth: {
    name: string;
    reservations: number;
    revenue: number;
  };
  upcomingEvents: {
    count: number;
    events: {
      reservationId: string;
      name: string;
      date: string;
      timeSlot: string;
      guests: string;
    }[];
  };
  pendingPayments: number;
  revenueByMonth: {
    month: string;
    revenue: number;
    count: number;
  }[];
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  night: 'Noche',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Error fetching stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard - HappyHub</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
                <p className="text-gray-500 mt-1">Panel de control de HappyHub</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={fetchStats}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Actualizar"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <Link href="/" className="btn-outline text-sm">
                  Ver sitio
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {loading && !stats ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : stats ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Reservas este mes</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {stats.currentMonth.reservations}
                      </p>
                    </div>
                    <div className="bg-primary-100 rounded-full p-3">
                      <Calendar className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Ingresos este mes</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {stats.currentMonth.revenue.toFixed(0)}€
                      </p>
                    </div>
                    <div className="bg-green-100 rounded-full p-3">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Próximos eventos</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {stats.upcomingEvents.count}
                      </p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Pagos pendientes</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {stats.pendingPayments}
                      </p>
                    </div>
                    <div className="bg-yellow-100 rounded-full p-3">
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Events */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-900">Próximos eventos</h2>
                      <Link
                        href="/admin/reservations"
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Ver todos
                      </Link>
                    </div>
                  </div>
                  <div className="p-6">
                    {stats.upcomingEvents.events.length > 0 ? (
                      <div className="space-y-4">
                        {stats.upcomingEvents.events.map((event) => (
                          <div
                            key={event.reservationId}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-primary-100 rounded-lg p-3">
                                <Calendar className="w-5 h-5 text-primary-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{event.name}</p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(event.date)} - {TIME_SLOT_LABELS[event.timeSlot] || event.timeSlot}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Users className="w-4 h-4" />
                              <span>{event.guests}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        No hay eventos próximos en los siguientes 7 días
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Acciones rápidas</h2>
                  </div>
                  <div className="p-6 space-y-3">
                    <Link
                      href="/admin/reservations"
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-primary-600" />
                      <span className="font-medium text-gray-900">Ver reservas</span>
                    </Link>
                    <Link
                      href="/admin/calendar"
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Calendar className="w-5 h-5 text-primary-600" />
                      <span className="font-medium text-gray-900">Calendario</span>
                    </Link>
                    <a
                      href="/api/admin/export"
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Download className="w-5 h-5 text-primary-600" />
                      <span className="font-medium text-gray-900">Exportar CSV</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Revenue Chart (Simple) */}
              <div className="mt-8 bg-white rounded-xl shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    <h2 className="text-lg font-bold text-gray-900">Evolución de ingresos</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-6 gap-4">
                    {stats.revenueByMonth.map((month) => (
                      <div key={month.month} className="text-center">
                        <div className="bg-gray-100 rounded-lg relative overflow-hidden" style={{ height: '120px' }}>
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-primary-500 transition-all"
                            style={{
                              height: `${Math.min(100, (month.revenue / Math.max(...stats.revenueByMonth.map(m => m.revenue), 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-sm font-medium text-gray-900">{month.revenue.toFixed(0)}€</p>
                        <p className="text-xs text-gray-500">{month.month}</p>
                        <p className="text-xs text-gray-400">{month.count} reservas</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </>
  );
}
