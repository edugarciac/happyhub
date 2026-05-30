import type { CollaborativeEvent, CollaborativeEventParticipant } from '@/utils/db/collaborative-events';

interface EventTopBarProps {
  event: CollaborativeEvent;
  participants: CollaborativeEventParticipant[];
}

export default function EventTopBar({ event, participants }: EventTopBarProps) {
  const confirmed = participants.filter((p) => p.rsvp_status === 'confirmed').length;
  const pending = participants.filter((p) => p.rsvp_status === 'pending').length;

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-lg font-bold text-gray-900 leading-tight">{event.title}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5 flex-wrap">
          {event.event_date && <span>📅 {formatDate(event.event_date)}</span>}
          {event.event_time && <span>🕕 {event.event_time.slice(0, 5)}</span>}
          {event.location && <span>📍 {event.location}</span>}
          <span>👥 {participants.length} invitados</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {confirmed > 0 && (
          <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            ✓ {confirmed} confirmados
          </span>
        )}
        {pending > 0 && (
          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            ⏳ {pending} pendientes
          </span>
        )}
      </div>
    </div>
  );
}
