import { useState } from 'react';
import Head from 'next/head';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Calendar, TrendingUp, Users, Euro, Download } from 'lucide-react';

export default function Admin() {
  const [dateRange, setDateRange] = useState('month');

  const stats = {
    totalReservations: 45,
    totalRevenue: 35000,
    upcomingEvents: 12,
    occupancyRate: 78,
  };

  const recentReservations = [
    {
      id: 'RES-001',
      name: 'María García',
      eventType: 'Cumpleaños',
      date: '2025-12-20',
      guests: 50,
      amount: 1150,
      status: 'confirmed',
    },
    {
      id: 'RES-002',
      name: 'Juan Martínez',
      eventType: 'Comunión',
      date: '2025-12-22',
      guests: 80,
      amount: 1850,
      status: 'pending',
    },
    {
      id: 'RES-003',
      name: 'Laura Sánchez',
      eventType: 'Bautizo',
      date: '2025-12-25',
      guests: 60,
      amount: 1400,
      status: 'confirmed',
    },
  ];

  const monthlyData = [
    { month: 'Enero', reservations: 12, revenue: 9500 },
    { month: 'Febrero', reservations: 15, revenue: 12000 },
    { month: 'Marzo', reservations: 18, revenue: 14500 },
    { month: 'Abril', reservations: 20, revenue: 16000 },
    { month: 'Mayo', reservations: 22, revenue: 18000 },
    { month: 'Junio', reservations: 25, revenue: 20000 },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      confirmed: { label: 'Confirmada', class: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Cancelada', class: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>{badge.label}</span>;
  };

  return (
    <>
      <Head>
        <title>Panel de Administración - HappyHub</title>
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16">
        <div className="container-custom">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
              <p className="text-xl text-gray-600">Gestiona reservas y consulta estadísticas</p>
            </div>
            <button className="btn-primary flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Exportar informe
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="mb-6">
            <label className="label">Período</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
              <option value="quarter">Último trimestre</option>
              <option value="year">Último año</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-8 h-8 opacity-80" />
                <span className="text-sm opacity-80">Total</span>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalReservations}</div>
              <div className="text-sm opacity-90">Reservas este mes</div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <Euro className="w-8 h-8 opacity-80" />
                <span className="text-sm opacity-80">Ingresos</span>
              </div>
              <div className="text-3xl font-bold mb-1">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-sm opacity-90">Este mes</div>
            </div>

            <div className="card bg-gradient-to-br from-secondary-500 to-secondary-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 opacity-80" />
                <span className="text-sm opacity-80">Próximos</span>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.upcomingEvents}</div>
              <div className="text-sm opacity-90">Eventos pendientes</div>
            </div>

            <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-sm opacity-80">Ocupación</span>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.occupancyRate}%</div>
              <div className="text-sm opacity-90">Tasa este mes</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Reservas recientes</h2>
              <div className="space-y-4">
                {recentReservations.map((reservation) => (
                  <div key={reservation.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">{reservation.name}</div>
                        <div className="text-sm text-gray-600">
                          {reservation.eventType} • {reservation.guests} personas
                        </div>
                      </div>
                      {getStatusBadge(reservation.status)}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{formatDate(reservation.date)}</span>
                      <span className="font-bold text-primary-600">{formatCurrency(reservation.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-outline w-full mt-6">Ver todas las reservas</button>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Estadísticas mensuales</h2>
              <div className="space-y-4">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{data.month}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${(data.reservations / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="font-semibold text-gray-900">{data.reservations}</div>
                      <div className="text-sm text-gray-600">{formatCurrency(data.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Calendario maestro</h2>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="grid grid-cols-7 gap-4 mb-4">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-600 text-sm">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 3;
                const isBooked = [5, 12, 18, 25].includes(day);
                const isToday = day === 8;

                return (
                  <div
                    key={i}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                      day < 1
                        ? 'text-gray-400'
                        : isBooked
                        ? 'bg-primary-600 text-white font-semibold'
                        : isToday
                        ? 'bg-secondary-100 text-secondary-900 font-semibold'
                        : 'hover:bg-gray-100 cursor-pointer'
                    }`}
                  >
                    {day > 0 && day}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-600 rounded"></div>
                <span>Reservado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-secondary-100 border border-secondary-300 rounded"></div>
                <span>Hoy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                <span>Disponible</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
