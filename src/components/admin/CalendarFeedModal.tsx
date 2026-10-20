import { useEffect, useState } from 'react';
import { X, Copy, Check, CalendarPlus } from 'lucide-react';

/** Enlace privado del calendario de reservas (.ics) e instrucciones para suscribirse */
export default function CalendarFeedModal({ onClose }: { onClose: () => void }) {
  const [feed, setFeed] = useState<{ url: string; webcalUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/admin/calendar-feed')
      .then((res) => res.json())
      .then((data) => (data.success ? setFeed(data) : setError(data.error || 'No se pudo obtener el enlace')))
      .catch(() => setError('Error de conexión'));
  }, []);

  const copy = async () => {
    if (!feed) return;
    try {
      await navigator.clipboard.writeText(feed.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('No se pudo copiar: selecciona el enlace y cópialo a mano');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><CalendarPlus className="w-5 h-5" /> Calendario de reservas</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Suscríbete una vez y verás las reservas y las fechas bloqueadas en tu calendario, siempre al día con el panel.
          Es de solo lectura: los cambios se hacen aquí.
        </p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {!feed && !error && <p className="text-sm text-gray-500 mb-4">Cargando enlace…</p>}

        {feed && (
          <>
            <div className="flex gap-2 mb-4">
              <input readOnly value={feed.url} onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 bg-gray-50" />
              <button onClick={copy} className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">📱 iPhone / iPad / Mac</p>
                <p>
                  <a href={feed.webcalUrl} className="text-primary-700 underline">Pulsa aquí para suscribirte</a>{' '}
                  o en Ajustes → Calendario → Cuentas → Añadir cuenta → Otra → Añadir calendario suscrito, y pega el enlace.
                  Se actualiza cada 15 minutos.
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">🗓️ Google Calendar</p>
                <p>En el ordenador: calendar.google.com → «Otros calendarios» → <strong>+</strong> → «Desde URL» → pega el enlace.
                  Google lo actualiza cada varias horas (no al instante).</p>
              </div>
            </div>

            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-4">
              El enlace es privado y contiene datos de clientes: no lo compartas fuera del equipo.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
