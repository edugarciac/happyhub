import { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle2, Clock, HelpCircle, XCircle, Trash2, UserPlus } from 'lucide-react';
import ExcelImporter from './ExcelImporter';
import InviteShareCard from './InviteShareCard';

interface Guest {
  id: number;
  user_id: number | null;
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
  eventTitle: string;
}

const RSVP_BADGE: Record<string, { label: string; className: string }> = {
  confirmed: { label: '✓ Confirmado', className: 'bg-green-50 text-green-700' },
  declined:  { label: '✗ Declinado',  className: 'bg-red-50 text-red-600' },
  maybe:     { label: '🤔 Quizás',    className: 'bg-amber-50 text-amber-700' },
  pending:   { label: '⏳ Pendiente', className: 'bg-gray-100 text-gray-500' },
};

type Tab = 'individual' | 'excel';

export default function GuestList({ eventId, isOrganizer, inviteCode, eventTitle }: GuestListProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('individual');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [adding, setAdding] = useState(false);
  const [resending, setResending] = useState<number | null>(null);

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

  const confirmed = guests.filter((g) => g.rsvp_status === 'confirmed').length;
  const pending   = guests.filter((g) => g.rsvp_status === 'pending').length;
  const maybe     = guests.filter((g) => g.rsvp_status === 'maybe').length;
  const declined  = guests.filter((g) => g.rsvp_status === 'declined').length;

  const statCards = [
    { key: 'confirmed', label: 'Confirmados', value: confirmed, icon: CheckCircle2, className: 'bg-green-50 text-green-700 border-green-100' },
    { key: 'pending', label: 'Pendientes', value: pending, icon: Clock, className: 'bg-gray-50 text-gray-600 border-gray-100' },
    { key: 'maybe', label: 'Quizás', value: maybe, icon: HelpCircle, className: 'bg-amber-50 text-amber-700 border-amber-100' },
    { key: 'declined', label: 'Declinados', value: declined, icon: XCircle, className: 'bg-red-50 text-red-600 border-red-100' },
  ];

  return (
    <div className="max-w-3xl">
      {guests.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {statCards.map(({ key, label, value, icon: Icon, className }) => (
            <div key={key} className={`border rounded-xl p-3 flex items-center gap-2.5 ${className}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-lg font-bold leading-none">{value}</p>
                <p className="text-xs font-medium opacity-80">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-5">
        <InviteShareCard inviteCode={inviteCode} eventTitle={eventTitle} />
      </div>

      {isOrganizer && (
        <div className="mb-5">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Añadir invitado
            </button>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
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
                <div className="flex flex-col sm:flex-row gap-2">
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
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-8">Cargando invitados...</p>
      ) : guests.length === 0 ? (
        <div className="text-center py-12 px-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">Aún no hay invitados</p>
          <p className="text-gray-400 text-sm mb-4">
            Añade invitados uno a uno, impórtalos desde Excel, o comparte el enlace de invitación.
          </p>
          {isOrganizer && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Añadir el primero
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="sm:hidden space-y-2">
            {guests.map((guest) => {
              const badge = RSVP_BADGE[guest.rsvp_status] || RSVP_BADGE.pending;
              const canResend = isOrganizer && !!guest.email && guest.rsvp_status === 'pending';
              return (
                <div key={guest.id} className="bg-white border border-gray-200 rounded-xl p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="font-semibold text-gray-900">{guest.name}</p>
                    {isOrganizer && (
                      <button
                        onClick={() => handleDelete(guest.id)}
                        className="text-gray-300 hover:text-red-400 p-1 -m-1 transition-colors flex-shrink-0"
                        title="Eliminar invitado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {guest.email && <p className="text-xs text-gray-400 mb-2">{guest.email}</p>}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${guest.user_id ? 'bg-violet-50 text-violet-600' : 'bg-gray-50 text-gray-400'}`}>
                      {guest.user_id ? '✓ Cuenta vinculada' : 'Solo RSVP'}
                    </span>
                  </div>
                  {canResend && (
                    <button
                      onClick={() => handleResend(guest.id)}
                      disabled={resending === guest.id}
                      className="mt-2 text-xs border border-gray-200 text-gray-500 px-2.5 py-1 rounded-lg hover:border-violet-300 hover:text-violet-600 transition-colors disabled:opacity-50"
                    >
                      {resending === guest.id ? '...' : 'Reenviar invitación'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">RSVP</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cuenta</th>
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
                      <td className="px-4 py-3 text-gray-500">
                        {guest.email || <span className="text-gray-300 italic text-xs">sin email</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${guest.user_id ? 'bg-violet-50 text-violet-600' : 'bg-gray-50 text-gray-400'}`}>
                          {guest.user_id ? '✓ Vinculada' : 'Solo RSVP'}
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
        </>
      )}
    </div>
  );
}
