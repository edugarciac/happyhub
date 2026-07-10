import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function ReservaRestringidaPage() {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>Acceso restringido - HappyHub</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-light/20 to-primary/10 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-4xl font-bold text-primary mb-2">HappyHub</h1>
            <p className="text-gray-500 mb-8">Solicitud de reserva no disponible</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex justify-center mb-4">
                <svg className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                Esta cuenta no tiene acceso a solicitar reservas
              </h2>
              {session?.user?.email && (
                <p className="text-sm text-blue-700 mb-2">
                  Sesión iniciada como <strong>{session.user.email}</strong>
                </p>
              )}
              <p className="text-sm text-blue-600">
                El flujo de solicitud de reserva está limitado a cuentas autorizadas mientras dure esta fase. Prueba con otra cuenta o contacta con nosotros.
              </p>
            </div>

            <div className="text-center">
              <Link href="/login" className="text-sm text-primary hover:text-primary/80 transition">
                Iniciar sesión con otra cuenta
              </Link>
            </div>

            <div className="mt-4">
              <Link href="/contacto" className="text-sm text-gray-600 hover:text-gray-800 transition">
                Contactar con nosotros
              </Link>
            </div>

            <div className="mt-4">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 transition">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
