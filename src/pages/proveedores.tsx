import { useState } from 'react';
import Head from 'next/head';
import ProviderCard from '@/components/ProviderCard';
import { Filter, Search } from 'lucide-react';

export default function Proveedores() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const mockRequests = [
    {
      id: '1',
      name: 'Catering para cumpleaños',
      service: 'Catering',
      eventDetails: {
        eventType: 'Cumpleaños',
        date: '20 de diciembre 2025',
        guests: 50,
      },
      price: 750,
      status: 'pending' as const,
    },
    {
      id: '2',
      name: 'Animación infantil',
      service: 'Animación',
      eventDetails: {
        eventType: 'Comunión',
        date: '15 de enero 2026',
        guests: 80,
      },
      price: 150,
      status: 'accepted' as const,
    },
    {
      id: '3',
      name: 'Fotografía profesional',
      service: 'Fotografía',
      eventDetails: {
        eventType: 'Bautizo',
        date: '10 de febrero 2026',
        guests: 60,
      },
      price: 200,
      status: 'pending' as const,
    },
    {
      id: '4',
      name: 'Decoración temática',
      service: 'Decoración',
      eventDetails: {
        eventType: 'Cumpleaños',
        date: '5 de marzo 2026',
        guests: 40,
      },
      price: 100,
      status: 'rejected' as const,
    },
  ];

  const handleAccept = (id: string) => {
    console.log('Accepting request:', id);
  };

  const handleReject = (id: string) => {
    console.log('Rejecting request:', id);
  };

  const filteredRequests = mockRequests.filter((request) => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch =
      searchTerm === '' ||
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.service.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    pending: mockRequests.filter((r) => r.status === 'pending').length,
    accepted: mockRequests.filter((r) => r.status === 'accepted').length,
    rejected: mockRequests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <>
      <Head>
        <title>Panel de Proveedores - HappyHub</title>
        <meta name="description" content="Gestiona tus solicitudes de servicio" />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Panel de Proveedores
          </h1>
          <p className="text-xl text-gray-600">
            Gestiona las solicitudes de servicio para eventos
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card bg-yellow-50 border border-yellow-200">
              <div className="text-sm text-yellow-800 mb-1">Pendientes</div>
              <div className="text-3xl font-bold text-yellow-900">{stats.pending}</div>
            </div>
            <div className="card bg-green-50 border border-green-200">
              <div className="text-sm text-green-800 mb-1">Aceptadas</div>
              <div className="text-3xl font-bold text-green-900">{stats.accepted}</div>
            </div>
            <div className="card bg-red-50 border border-red-200">
              <div className="text-sm text-red-800 mb-1">Rechazadas</div>
              <div className="text-3xl font-bold text-red-900">{stats.rejected}</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar solicitudes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="text-gray-600 w-5 h-5" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="input-field"
              >
                <option value="all">Todas</option>
                <option value="pending">Pendientes</option>
                <option value="accepted">Aceptadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay solicitudes
              </h3>
              <p className="text-gray-600">
                No se encontraron solicitudes con los filtros seleccionados
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((request) => (
                <ProviderCard
                  key={request.id}
                  {...request}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información para proveedores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">⏰ Tiempo de respuesta</h3>
                <p className="text-gray-600">
                  Te recomendamos responder a las solicitudes en menos de 24 horas para mantener una buena reputación.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">✅ Compromiso</h3>
                <p className="text-gray-600">
                  Al aceptar una solicitud, te comprometes a proporcionar el servicio en la fecha y condiciones acordadas.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">💰 Pagos</h3>
                <p className="text-gray-600">
                  Los pagos se realizan directamente con el cliente. HappyHub actúa como intermediario para la coordinación.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📞 Contacto</h3>
                <p className="text-gray-600">
                  Una vez aceptada la solicitud, recibirás los datos de contacto del cliente para coordinar detalles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
