import Link from 'next/link';

const SECTIONS = [
  { id: 'timeline', emoji: '⏱', label: 'Timeline' },
  { id: 'info', emoji: '📋', label: 'Info' },
  { id: 'invitados', emoji: '👥', label: 'Invitados' },
  { id: 'regalo', emoji: '🎁', label: 'Regalo' },
  { id: 'entretenimiento', emoji: '🎭', label: 'Entret.' },
  { id: 'detalles', emoji: '🎀', label: 'Detalles' },
  { id: 'servicios', emoji: '🛎', label: 'Servicios' },
  { id: 'fotos', emoji: '📸', label: 'Fotos' },
  { id: 'mensajes', emoji: '💬', label: 'Mensajes' },
] as const;

interface EventSidebarProps {
  eventId: number;
  activeSection: string;
}

export default function EventSidebar({ eventId, activeSection }: EventSidebarProps) {
  return (
    <aside className="w-[76px] flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-3 gap-1 sticky top-16 self-start min-h-[calc(100vh-4rem)] overflow-y-auto">
      {SECTIONS.map((s) => {
        const isActive = activeSection === s.id;
        return (
          <Link
            key={s.id}
            href={`/mis-eventos/${eventId}?section=${s.id}`}
            className={`w-[60px] rounded-lg py-2 px-1 flex flex-col items-center gap-0.5 transition-colors ${
              isActive
                ? 'bg-violet-100 text-violet-700'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <span className="text-xl leading-none">{s.emoji}</span>
            <span className={`text-[9px] font-medium text-center leading-tight ${isActive ? 'text-violet-700' : ''}`}>
              {s.label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
