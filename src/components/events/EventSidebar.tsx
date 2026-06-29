import Link from 'next/link';
import {
  Clock,
  Users,
  Gift,
  Drama,
  Bell,
  ConciergeBell,
  Camera,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';

const SECTIONS: { id: string; icon: LucideIcon; label: string }[] = [
  { id: 'timeline', icon: Clock, label: 'Timeline' },
  { id: 'invitados', icon: Users, label: 'Invitados' },
  { id: 'regalo', icon: Gift, label: 'Regalo' },
  { id: 'entretenimiento', icon: Drama, label: 'Entretenimiento' },
  { id: 'recordatorios', icon: Bell, label: 'Recordatorios' },
  { id: 'servicios', icon: ConciergeBell, label: 'Servicios' },
  { id: 'fotos', icon: Camera, label: 'Fotos' },
  { id: 'mensajes', icon: MessageCircle, label: 'Mensajes' },
];

interface EventSidebarProps {
  eventId: number;
  activeSection: string;
}

export default function EventSidebar({ eventId, activeSection }: EventSidebarProps) {
  return (
    <aside className="w-[200px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col py-4 px-2.5 gap-1 sticky top-16 self-start min-h-[calc(100vh-4rem)] overflow-y-auto">
      {SECTIONS.map(({ id, icon: Icon, label }) => {
        const isActive = activeSection === id;
        return (
          <Link
            key={id}
            href={`/mis-eventos/${eventId}?section=${id}`}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-violet-50 hover:text-violet-700'
            }`}
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={isActive ? 2.25 : 2} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
