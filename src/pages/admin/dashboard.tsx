import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import { apiClient } from '../../lib/apiClient';
import { Star, Users, Calendar, Building2, Briefcase, Tag } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  totalReservations: number;
  totalReviews: number;
  pendingReservations: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalReservations: 0,
    totalReviews: 0,
    pendingReservations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch quick stats (could be optimized with single endpoint later)
      const [reviewsRes] = await Promise.all([
        fetch('/api/reviews/stats'),
      ]);

      const reviewsData = await reviewsRes.json();

      setStats({
        totalUsers: 0, // TODO: Add endpoint
        totalReservations: 0, // TODO: Add endpoint
        totalReviews: reviewsData.stats?.count || 0,
        pendingReservations: 0, // TODO: Add endpoint
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const managementCards = [
    {
      title: 'Reseñas',
      icon: Star,
      href: '/admin/reviews',
      count: stats.totalReviews,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Clientes',
      icon: Users,
      href: '/admin/clients',
      count: stats.totalUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Reservas',
      icon: Calendar,
      href: '/admin/reservations',
      count: stats.totalReservations,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      badge: stats.pendingReservations > 0 ? `${stats.pendingReservations} pendientes` : undefined,
    },
    {
      title: 'Tipos de Eventos',
      icon: Tag,
      href: '/admin/event-types',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Proveedores',
      icon: Building2,
      href: '/admin/providers',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Servicios',
      icon: Briefcase,
      href: '/admin/services',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  return (
    <>
      <Head>
        <title>Dashboard Admin - HappyHub</title>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Administración</h1>
            <p className="text-gray-600">Gestiona todos los aspectos de Happyhub desde aquí</p>
          </div>

          {/* Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 hover:border-primary-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${card.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    {card.count !== undefined && card.count > 0 && (
                      <span className="text-2xl font-bold text-gray-900">{card.count}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h3>
                  {card.badge && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      {card.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
