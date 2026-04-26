import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Loader2, Users, Calendar, MapPin } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { CollaborativeEvent } from '@/utils/db/collaborative-events';

export default function UnirseEventoPage() {
  const router = useRouter();
  const { inviteCode } = router.query;
  const { data: session, status: authStatus } = useSession();

  const [eventPreview, setEventPreview] = useState<CollaborativeEvent | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [joinedEventId, setJoinedEventId] = useState<number | null>(null);

  useEffect(() => {
    if (!inviteCode) return;
    setLoadingPreview(true);

    // Pre-fill name/email from session if available
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }

    // We'll use the join endpoint to preview — but to avoid showing the form without event info,
    // we call GET on the join endpoint (not available), so we just prompt immediately.
    setLoadingPreview(false);
  }, [inviteCode, session]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;
    setError('');
    setJoining(true);

    try {
      const res = await fetch(`/api/events/collaborative/join/${inviteCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al unirse al evento');
        return;
      }

      setEventPreview(data.event);
      setJoinedEventId(data.event.id);
      setJoined(true);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setJoining(false);
    }
  };

  if (joined && eventPreview) {
    return (
      <>
        <Head>
          <title>¡Te has unido! – HappyHub</title>
        </Head>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Ya eres parte del evento!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Te has unido a <strong>{eventPreview.title}</strong>.
            </p>
            {session?.user ? (
              <button
                onClick={() => router.push(`/eventos/${joinedEventId}`)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Ver el evento
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Inicia sesión o regístrate para ver todos los detalles del evento.
                </p>
                <button
                  onClick={() => router.push(`/login?redirect=/eventos/${joinedEventId}`)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => router.push(`/register?redirect=/eventos/${joinedEventId}`)}
                  className="w-full border border-purple-300 text-purple-700 font-semibold py-3 rounded-xl hover:bg-purple-50 transition-colors"
                >
                  Crear cuenta
                </button>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Unirte al evento – HappyHub</title>
      </Head>
      <Header />

      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">👋</div>
            <h1 className="text-xl font-bold text-gray-900">Te han invitado a un evento</h1>
            <p className="text-gray-500 text-sm mt-1">
              Introduce tu nombre para unirte.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tu nombre *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="¿Cómo te llamas?"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {!session?.user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Para recibir notificaciones"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={joining || !name}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {joining && <Loader2 className="w-4 h-4 animate-spin" />}
              {joining ? 'Uniéndome...' : 'Unirme al evento'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}
