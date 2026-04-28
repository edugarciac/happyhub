import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { XCircle, ArrowLeft, Phone, Mail } from 'lucide-react';

export default function BookingCancel() {
  const router = useRouter();
  const { reservation_id } = router.query;

  return (
    <>
      <Head>
        <title>Pago Cancelado - HappyHub</title>
        <meta name="description" content="El pago de tu reserva ha sido cancelado" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4">
        <div className="container-custom max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Cancel icon */}
            <div className="mb-6">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Pago Cancelado
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              El proceso de pago ha sido cancelado
            </p>

            {/* Info box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-yellow-800 mb-3">No te preocupes</h3>
              <ul className="space-y-2 text-yellow-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  No se ha realizado ningún cargo en tu tarjeta
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  Tu selección de fecha y hora no se ha perdido
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  Puedes volver a intentarlo cuando quieras
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                href="/reservas"
                className="btn-primary flex items-center justify-center gap-2 flex-1"
              >
                <ArrowLeft className="w-5 h-5" />
                Volver a reservar
              </Link>
              <Link
                href="/"
                className="btn-outline flex items-center justify-center gap-2 flex-1"
              >
                Ir al inicio
              </Link>
            </div>

            {/* Reasons section */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">
                ¿Por qué se canceló el pago?
              </h3>
              <p className="text-gray-600 mb-4">
                El pago puede haberse cancelado por varios motivos:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  Cancelación voluntaria durante el proceso
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  Cierre del navegador o pérdida de conexión
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  Tiempo de sesión expirado
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  Datos de tarjeta incorrectos
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="font-semibold text-gray-900 mb-4">
                ¿Necesitas ayuda?
              </h3>
              <p className="text-gray-600 mb-4">
                Si tienes problemas con el pago, no dudes en contactarnos:
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a
                  href="https://wa.me/34624645517"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <Phone className="w-5 h-5" />
                  WhatsApp: 624 645 517
                </a>
                <a
                  href="mailto:hola@happyhub.es"
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <Mail className="w-5 h-5" />
                  hola@happyhub.es
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
