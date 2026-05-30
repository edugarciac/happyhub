import { useState, useEffect, useCallback } from 'react';
import ExcelImporter from './ExcelImporter';

interface Guest {
  id: number;
  name: string;
  email: string | null;
  rsvp_status: 'pending' | 'confirmed' | 'declined' | 'maybe';
  invite_token: string | null;
  invited_at: string | null;
  rsvp_note: string | null;
}

interface GuestListProps {
  eventId: number;
  isOrganizer: boolean;
  inviteCode: string;
}

const RSVP_BADGE: Record<string, { label: string; className: string }> = {
  confirmed: { label: '✓ Confirmado', className: 'bg-green-50 text-green-700' },
  declined:  { label: '✗ Declinado',  className: 'bg-red-50 text-red-600' },
  maybe:     { label: '🤔 Quizás',    className: 'bg-amber-50 text-amber-700' },
  pending:   { label: '⏳ Pendiente', className: 'bg-gray-100 text-gray-500' },
};

type Tab = 'individual' | 'excel';

export default function GuestList({ eventId, isOrganizer, inviteCode }: GuestListProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('individual');
  const [form, setForm] = useState({ name: '', email: '' });
  const [adding, setAdding] = useState(false);
  const [resending, setResending] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/unirse/${inviteCode}`
    : `/unirse/${inviteCode}`;

  const fetchGuests = useCallback(async () => {
    const res = await fetch(`/api/events/collaborative/${eventId}/guests`);
    if (res.ok) {
      const data = await res.json();
      setGuests(data.guests);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchGuests(); }, [fetchGuests]);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim() || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setGuests((prev) => [...prev, data.guest]);
        setForm({ name: '', email: '' });
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (guestId: number) => {
    if (!confirm('¿Eliminar este invitado?')) return;
    const res = await fetch(`/api/events/collaborative/${eventId}/guests/${guestId}`, { method: 'DELETE' });
    if (res.ok) setGuests((prev) => prev.filter((g) => g.id !== guestId));
  };

  const handleResend = async (guestId: number) => {
    setResending(guestId);
    try {
      await fetch(`/api/events/collaborative/${eventId}/guests/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId }),
      });
    } finally {
      setResending(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmed = guests.filter((g) => g.rsvp_status === 'confirmed').length;
  const pending   = guests.filter((g) => g.rsvp_status === 'pending').length;
  const declined  = guests.filter((g) => g.rsvp_status === 'declined').length;

  return (
    <div className="max-w-3xl">
      <div className="flex gap-2 flex-wrap mb-5">
        {confirmed > 0 && (
          <span className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">✓ {confirmed} confirmados</span>
        )}
        {pending > 0 && (
          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">⏳ {pending} pendientes</span>
        )}
        {declined > 0 && (
          <span className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">✗ {declined} declinados</span>
        )}
        {guests.length === 0 && !loading && (
          <span className="text-gray-400 text-sm">Sin invitados aún</span>
        )}
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-violet-700 mb-0.5">🔗 Enlace de invitación general</p>
          <p className="text-sm text-gray-600 break-all">{inviteUrl}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 bg-violet-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors"
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      {isOrganizer && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
          <div className="flex mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setTab('individual')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${tab === 'individual' ? 'bg-violet-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              + Añadir uno
            </button>
            <button
              onClick={() => setTab('excel')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${tab === 'excel' ? 'bg-violet-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              📊 Importar Excel
            </button>
          </div>

          {tab === 'individual' ? (
            <div className="flex gap-2">
              <input
                placeholder="Nombre *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <input
                placeholder="Email (opcional)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                onClick={handleAdd}
                disabled={!form.name.trim() || adding}
                className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
              >
                {adding ? '...' : 'Añadir'}
              </button>
            </div>
          ) : (
            <ExcelImporter
              eventId={eventId}
              onImported={() => fetchGuests()}
            />
          )}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-8">Cargando invitados...</p>
      ) : guests.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Sin invitados aún. Añade el primero o comparte el enlace.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">RSVP</th>
                {isOrganizer && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Invit.</th>
                )}
                {isOrganizer && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => {
                const badge = RSVP_BADGE[guest.rsvp_status] || RSVP_BADGE.pending;
                const canResend = isOrganizer && !!guest.email && guest.rsvp_status === 'pending';
                return (
                  <tr key={guest.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{guest.name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {guest.email || <span className="text-gray-300 italic text-xs">sin email</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    {isOrganizer && (
                      <td className="px-4 py-3 hidden md:table-cell">
                        {canResend ? (
                          <button
                            onClick={() => handleResend(guest.id)}
                            disabled={resending === guest.id}
                            className="text-xs border border-gray-200 text-gray-500 px-2.5 py-1 rounded-lg hover:border-violet-300 hover:text-violet-600 transition-colors disabled:opacity-50"
                          >
                            {resending === guest.id ? '...' : 'Reenviar'}
                          </button>
                        ) : guest.invited_at ? (
                          <span className="text-xs text-gray-400">
                            {new Date(guest.invited_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    )}
                    {isOrganizer && (
                      <td className="px-2 py-3 text-right">
                        <button
                          onClick={() => handleDelete(guest.id)}
                          className="text-gray-300 hover:text-red-400 p-1 transition-colors"
                          title="Eliminar invitado"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
