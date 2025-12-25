import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ReservationForm from '@/components/ReservationForm';
import { CheckCircle } from 'lucide-react';

export default function Reservas() {
  const router = useRouter();
  const { date, duration } = router.query;
  const [showSuccess, setShowSuccess] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);

  const handleSuccess = (id: string) => {
    setReservationId(id);
    setShowSuccess(true);
  };

  if (showSuccess && reservationId) {
    return (
      <>
        <Head>
          <title>Reserva Confirmada - HappyHub</title>
        </Head>

        <section className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-16">
          <div className="container-custom">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="mb-6">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                ¡Solicitud Enviada!
              </h1>

              <p className="text-xl text-gray-600 mb-6">
                Tu solicitud de reserva ha sido recibida correctamente
              </p>

              <div className="bg-primary-50 rounded-lg p-6 mb-8">
                <p className="text-sm text-gray-600 mb-2">Número de solicitud</p>
                <p className="text-2xl font-bold text-primary-600">{reservationId}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-yellow-800 font-semibold mb-1">
                  ⏳ Pendiente de aprobación
                </p>
                <p className="text-sm text-yellow-700">
                  Revisaremos tu solicitud manualmente y te contactaremos pronto
                </p>
              </div>

              <div className="space-y-4 text-left mb-8">
                <div className="flex items-start">
                  <div className="bg-primary-100 rounded-full p-2 mr-4">
                    <span className="text-primary-600 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Revisión de solicitud</h3>
                    <p className="text-gray-600 text-sm">
                      Nuestro equipo revisará tu solicitud en las próximas 24 horas
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary-100 rounded-full p-2 mr-4">
                    <span className="text-primary-600 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Confirmación personal</h3>
                    <p className="text-gray-600 text-sm">
                      Te contactaremos por teléfono o email para confirmar todos los detalles
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary-100 rounded-full p-2 mr-4">
                    <span className="text-primary-600 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Enlace de pago</h3>
                    <p className="text-gray-600 text-sm">
                      Una vez aprobada, recibirás un enlace seguro para realizar el pago
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={`/mi-reserva/${reservationId}`}
                  className="btn-primary flex-1"
                >
                  Ver mi reserva
                </a>
                <a href="/" className="btn-outline flex-1">
                  Volver al inicio
                </a>
              </div>

              <p className="text-sm text-gray-600 mt-6">
                Si tienes alguna pregunta, no dudes en{' '}
                <a href="/contacto" className="text-primary-600 hover:underline">
                  contactarnos
                </a>
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Reservar - HappyHub</title>
        <meta name="description" content="Completa tu reserva para tu celebración en HappyHub" />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Completa tu Reserva
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Estás a un paso de asegurar tu celebración perfecta
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-primary-900 mb-2">
                📋 Información importante
              </h2>
              <ul className="space-y-2 text-sm text-primary-800">
                <li>• Recibirás confirmación inmediata por email y WhatsApp</li>
                <li>• El pago se puede realizar con tarjeta, transferencia o efectivo</li>
                <li>• Se requiere un depósito del 30% para confirmar la reserva</li>
                <li>• Cancelación gratuita hasta 15 días antes del evento</li>
              </ul>
            </div>

            <div className="card">
              <ReservationForm
                preselectedDate={date as string}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Preguntas frecuentes sobre reservas
            </h2>
            <div className="space-y-4">
              <details className="bg-white rounded-lg p-6 shadow-sm">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  ¿Cuándo debo pagar?
                </summary>
                <p className="mt-3 text-gray-600">
                  Se requiere un depósito del 30% al confirmar la reserva. El resto se abona el día del evento.
                </p>
              </details>

              <details className="bg-white rounded-lg p-6 shadow-sm">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  ¿Puedo cambiar la fecha de mi reserva?
                </summary>
                <p className="mt-3 text-gray-600">
                  Sí, puedes cambiar la fecha sin coste adicional hasta 30 días antes del evento, sujeto a disponibilidad.
                </p>
              </details>

              <details className="bg-white rounded-lg p-6 shadow-sm">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  ¿Qué incluye el precio base?
                </summary>
                <p className="mt-3 text-gray-600">
                  El precio base incluye el alquiler del espacio durante el tiempo seleccionado, limpieza, mobiliario básico y sistema de sonido.
                </p>
              </details>

              <details className="bg-white rounded-lg p-6 shadow-sm">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  ¿Puedo visitar el espacio antes de reservar?
                </summary>
                <p className="mt-3 text-gray-600">
                  Por supuesto. Contáctanos para agendar una visita y conocer nuestras instalaciones.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
