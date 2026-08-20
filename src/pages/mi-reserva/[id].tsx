import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Calendar, Clock, Users, MapPin, Download, Edit, X, MessageCircle } from 'lucide-react';
import { formatCurrency, formatDate, formatEventType } from '@/utils/formatters';

export default function MiReserva() {
  const router = useRouter();
  const { id } = router.query;
  const [showCancelModal, setShowCancelModal] = useState(false);

  const reservationData = {
    id: id as string,
    name: 'María García',
    email: 'maria@example.com',
    phone: '+34 600 123 456',
    eventType: 'cumpleaños',
    date: '2025-12-20',
    time: '16:00',
    guests: 50,
    duration: '4h',
    extras: ['catering', 'decoracion', 'animacion'],
    totalPrice: 1150,
    status: 'confirmed',
    paymentStatus: 'partial',
    depositPaid: 345,
    remainingAmount: 805,
    createdAt: '2025-12-01',
  };

  const extrasDetails = [
    { id: 'catering', name: 'Catering', price: 750 },
    { id: 'decoracion', name: 'Decoración', price: 100 },
    { id: 'animacion', name: 'Animación', price: 150 },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      confirmed: { label: 'Confirmada', class: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Cancelada', class: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  const handleCancelReservation = async () => {
    console.log('Cancelling reservation:', id);
    setShowCancelModal(false);
  };

  return (
    <>
      <Head>
        <title>Mi Reserva #{id} - HappyHub</title>
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 pt-28 pb-16">
        <div className="container-custom">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Mi Reserva</h1>
              <p className="text-gray-600">Número de reserva: #{id}</p>
            </div>
            {getStatusBadge(reservationData.status)}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Detalles del evento</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600">Fecha</div>
                      <div className="font-semibold">
                        {formatDate(reservationData.date, 'EEEE, d MMMM yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600">Hora y duración</div>
                      <div className="font-semibold">{reservationData.time} - {reservationData.duration}</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600">Número de invitados</div>
                      <div className="font-semibold">{reservationData.guests} personas</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600">Tipo de evento</div>
                      <div className="font-semibold">{formatEventType(reservationData.eventType)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Servicios contratados</h2>

                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="font-medium">Alquiler del espacio ({reservationData.duration})</span>
                    <span className="font-semibold">{formatCurrency(400)}</span>
                  </div>

                  {extrasDetails.map((extra) => (
                    <div key={extra.id} className="flex justify-between items-center pb-3 border-b">
                      <span className="font-medium">{extra.name}</span>
                      <span className="font-semibold">{formatCurrency(extra.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Datos de contacto</h2>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Nombre</div>
                    <div className="font-semibold">{reservationData.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-semibold">{reservationData.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Teléfono</div>
                    <div className="font-semibold">{reservationData.phone}</div>
                  </div>
                </div>
              </div>

              <div className="card bg-primary-50 border border-primary-200">
                <h3 className="font-semibold text-primary-900 mb-2">📍 Instrucciones de acceso</h3>
                <p className="text-primary-800 mb-2">
                  El día del evento, dirígete a la entrada principal de HappyHub en Calle Ejemplo 123, Madrid.
                </p>
                <p className="text-primary-800">
                  Recibirás un código de acceso 24 horas antes del evento por WhatsApp y email.
                </p>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="card sticky top-24 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Resumen de pago</h3>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{formatCurrency(reservationData.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Depósito pagado (30%)</span>
                      <span className="font-semibold">-{formatCurrency(reservationData.depositPaid)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-bold">Pendiente de pago</span>
                        <span className="text-xl font-bold text-primary-600">
                          {formatCurrency(reservationData.remainingAmount)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        A pagar antes de comenzar el evento
                      </p>
                    </div>
                  </div>

                  {reservationData.paymentStatus !== 'completed' && (
                    <button className="btn-primary w-full mb-3">
                      Pagar ahora
                    </button>
                  )}

                  <button className="btn-outline w-full flex items-center justify-center">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar factura
                  </button>
                </div>

                <div className="border-t pt-6 space-y-3">
                  <Link
                    href={`/mi-reserva/${id}/editar`}
                    className="btn-secondary w-full flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modificar reserva
                  </Link>

                  <Link
                    href="/contacto"
                    className="btn-outline w-full flex items-center justify-center"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contactar soporte
                  </Link>

                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full text-red-600 hover:text-red-700 font-semibold py-2 transition-colors"
                  >
                    Cancelar reserva
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">¿Cancelar reserva?</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Según nuestra política de cancelación, si cancelas ahora recibirás una devolución del 100% del depósito.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 btn-outline"
              >
                No, mantener
              </button>
              <button
                onClick={handleCancelReservation}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
