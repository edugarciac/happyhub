import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function VerificacionPendientePage() {
  const router = useRouter();
  const { email } = router.query;
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResend = async () => {
    setResending(true);
    setResendMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();

      if (data.success) {
        setResendMessage('Email de verificacion reenviado. Revisa tu bandeja de entrada.');
      } else if (data.error === 'already_verified') {
        setResendMessage('Tu email ya esta verificado. Puedes iniciar sesion.');
      } else {
        setResendMessage(data.error || 'Error al reenviar. Intenta de nuevo.');
      }
    } catch {
      setResendMessage('Error de conexion. Intenta de nuevo.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Head>
        <title>Verifica tu email - HappyHub</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-light/20 to-primary/10 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-4xl font-bold text-primary mb-2">HappyHub</h1>
            <p className="text-gray-500 mb-8">Revisa tu email</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex justify-center mb-4">
                <svg className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                Hemos enviado un enlace de verificacion
              </h2>
              {email && (
                <p className="text-sm text-blue-700 mb-2">
                  a <strong>{email}</strong>
                </p>
              )}
              <p className="text-sm text-blue-600">
                Revisa tu bandeja de entrada (y la carpeta de spam).
                El enlace es valido durante 24 horas.
              </p>
            </div>

            {resendMessage && (
              <div className={`text-sm mb-4 p-3 rounded-lg ${
                resendMessage.includes('reenviado') || resendMessage.includes('verificado')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {resendMessage}
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition mb-4"
            >
              {resending ? 'Reenviando...' : 'Reenviar email de verificacion'}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-primary hover:text-primary/80 transition">
                Ir a iniciar sesion
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
