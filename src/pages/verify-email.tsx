import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

type VerifyState = 'loading' | 'success' | 'expired' | 'used' | 'invalid' | 'error';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token } = router.query;
  const [state, setState] = useState<VerifyState>('loading');

  useEffect(() => {
    if (!router.isReady) return;

    if (!token || typeof token !== 'string') {
      setState('invalid');
      return;
    }

    async function verify() {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (data.success) {
          setState('success');
          // Update session token if returned
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          setTimeout(() => router.push('/'), 3000);
        } else {
          setState(data.error === 'expired' ? 'expired' : data.error === 'used' ? 'used' : 'invalid');
        }
      } catch {
        setState('error');
      }
    }

    verify();
  }, [router.isReady, token]);

  const content: Record<VerifyState, { title: string; message: string; icon: string }> = {
    loading: {
      title: 'Verificando...',
      message: 'Estamos verificando tu email, un momento.',
      icon: '',
    },
    success: {
      title: 'Email verificado',
      message: 'Tu email ha sido verificado correctamente. Redirigiendo al inicio...',
      icon: '',
    },
    expired: {
      title: 'Enlace caducado',
      message: 'Este enlace ha caducado. Solicita uno nuevo desde tu cuenta.',
      icon: '',
    },
    used: {
      title: 'Ya verificado',
      message: 'Este email ya ha sido verificado. Puedes iniciar sesion normalmente.',
      icon: '',
    },
    invalid: {
      title: 'Enlace no valido',
      message: 'El enlace de verificacion no es valido. Comprueba que has copiado la URL completa.',
      icon: '',
    },
    error: {
      title: 'Error',
      message: 'Ha ocurrido un error al verificar tu email. Intenta de nuevo mas tarde.',
      icon: '',
    },
  };

  const { title, message } = content[state];

  const bgColor = state === 'success' ? 'bg-green-50 border-green-200' :
    state === 'loading' ? 'bg-blue-50 border-blue-200' :
    'bg-yellow-50 border-yellow-200';

  const textColor = state === 'success' ? 'text-green-800' :
    state === 'loading' ? 'text-blue-800' :
    'text-yellow-800';

  return (
    <>
      <Head>
        <title>Verificar email - HappyHub</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-light/20 to-primary/10 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-4xl font-bold text-primary mb-6">HappyHub</h1>

            <div className={`${bgColor} border rounded-lg p-6 mb-6`}>
              {state === 'loading' && (
                <div className="flex justify-center mb-4">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
              <h2 className={`text-lg font-semibold ${textColor} mb-2`}>{title}</h2>
              <p className={`text-sm ${textColor}`}>{message}</p>
            </div>

            {(state === 'expired' || state === 'error') && (
              <Link
                href="/verificacion-pendiente"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition mb-4"
              >
                Solicitar nuevo enlace
              </Link>
            )}

            {(state === 'used' || state === 'success') && (
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition mb-4"
              >
                Iniciar sesion
              </Link>
            )}

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
