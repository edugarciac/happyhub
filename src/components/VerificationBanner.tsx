import { useState } from 'react';
import Link from 'next/link';

interface VerificationBannerProps {
  token?: string | null;
}

export default function VerificationBanner({ token }: VerificationBannerProps) {
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      const authToken = token || localStorage.getItem('token');
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      const data = await response.json();
      if (data.success) setSent(true);
    } catch {
      // silently fail
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-yellow-800">
          Verifica tu email para acceder a todas las funciones.{' '}
          <Link href="/verificacion-pendiente" className="underline font-medium hover:text-yellow-900">
            Mas informacion
          </Link>
        </p>
        {sent ? (
          <span className="text-sm text-green-700 font-medium">Email reenviado</span>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline disabled:opacity-50"
          >
            {resending ? 'Reenviando...' : 'Reenviar email'}
          </button>
        )}
      </div>
    </div>
  );
}
