import { useState, useEffect } from 'react';

type Consent = 'pending' | 'accepted' | 'rejected';

function getConsent(): Consent {
  if (typeof window === 'undefined') return 'pending';
  return (localStorage.getItem('cookie_consent') as Consent) || 'pending';
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<Consent>('pending');

  useEffect(() => {
    setConsent(getConsent());
  }, []);

  return consent;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === 'pending') setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setVisible(false);
    window.location.reload();
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-gray-600">
          <p className="font-semibold text-gray-900 mb-1">Cookies</p>
          <p>
            Usamos cookies de analisis (Google Analytics) para mejorar tu experiencia.
            Las cookies tecnicas necesarias para el funcionamiento del sitio se usan siempre.{' '}
            <a href="/politica-privacidad" className="text-primary-600 underline">
              Politica de privacidad
            </a>
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleReject}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Rechazar
          </button>
          <button
            onClick={handleAccept}
            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
