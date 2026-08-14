import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Music, CheckCircle2 } from 'lucide-react';

interface Status {
  connected: boolean;
  displayName?: string | null;
}

export default function SpotifyConnectionCard() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/account/spotify/status');
    if (res.ok) setStatus(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.spotify === 'connected') {
      toast.success('Cuenta de Spotify conectada');
      router.replace('/area-privada', undefined, { shallow: true });
    } else if (router.query.error?.toString().startsWith('spotify_')) {
      toast.error('No se pudo conectar Spotify. Inténtalo de nuevo.');
      router.replace('/area-privada', undefined, { shallow: true });
    }
  }, [router]);

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar tu cuenta de Spotify? La música dejará de sincronizarse en tus eventos hasta que vuelvas a conectarla.')) return;
    setDisconnecting(true);
    try {
      const res = await fetch('/api/account/spotify/disconnect', { method: 'POST' });
      if (res.ok) {
        toast.success('Spotify desconectado');
        setStatus({ connected: false });
      } else {
        toast.error('Error al desconectar');
      }
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Music className="w-5 h-5 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-900">Música colaborativa</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      ) : status?.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-gray-700">
              Conectado como <strong>{status.displayName || 'tu cuenta de Spotify'}</strong>
            </span>
          </div>
          <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 inline-block">
            ✓ Puedes activar Música en tus eventos
          </p>
          <div className="pt-1">
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-xs text-gray-400 hover:text-red-500 underline transition-colors disabled:opacity-50"
            >
              {disconnecting ? 'Desconectando...' : 'Desconectar Spotify'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            Conecta tu cuenta de Spotify para compartir una playlist colaborativa en tus eventos: tus invitados podrán sugerir canciones.
          </p>
          <a
            href="/api/account/spotify/connect"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Music className="w-4 h-4" />
            Conectar Spotify
          </a>
        </div>
      )}
    </section>
  );
}
