import Link from 'next/link';
import { Users, Gift, Music, Gamepad2, Sparkles, type LucideIcon } from 'lucide-react';

interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const SECTIONS: Section[] = [
  { id: 'invitados', label: 'Invitados', icon: Users, color: 'ocean' },
  { id: 'regalo', label: 'Regalo', icon: Gift, color: 'rose' },
  { id: 'musica', label: 'Música', icon: Music, color: 'violet' },
  { id: 'actividades', label: 'Actividades', icon: Gamepad2, color: 'amber' },
  { id: 'detalles', label: 'Detalles personalizados', icon: Sparkles, color: 'orange' },
];

const ACTIVE_CLASSES: Record<string, string> = {
  primary: 'bg-primary-600 text-white shadow-lg shadow-primary-600/30',
  ocean: 'bg-ocean-600 text-white shadow-lg shadow-ocean-600/30',
  rose: 'bg-rose-500 text-white shadow-lg shadow-rose-500/30',
  violet: 'bg-violet-600 text-white shadow-lg shadow-violet-600/30',
  amber: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
  orange: 'bg-orange-500 text-white shadow-lg shadow-orange-500/30',
};

const DOT_CLASSES: Record<string, string> = {
  primary: 'bg-primary-500',
  ocean: 'bg-ocean-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
};

interface EventSidebarProps {
  eventId: number;
  activeSection: string;
}

export default function EventSidebar({ eventId, activeSection }: EventSidebarProps) {
  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden md:flex w-60 flex-shrink-0 bg-white border-r border-gray-100 flex-col py-6 px-3 gap-1.5 sticky top-16 self-start min-h-[calc(100vh-4rem)] overflow-y-auto">
        {SECTIONS.map((s) => {
          const isActive = activeSection === s.id;
          const Icon = s.icon;
          return (
            <Link
              key={s.id}
              href={`/mis-eventos/${eventId}?section=${s.id}`}
              className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 font-semibold text-sm transition-all duration-200 ${
                isActive
                  ? ACTIVE_CLASSES[s.color]
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 transition-colors ${
                  isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-white'
                }`}
              >
                <Icon className="w-4 h-4" />
              </span>
              {s.label}
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </Link>
          );
        })}
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-between px-1">
          {SECTIONS.map((s) => {
            const isActive = activeSection === s.id;
            const Icon = s.icon;
            return (
              <Link
                key={s.id}
                href={`/mis-eventos/${eventId}?section=${s.id}`}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-w-0"
              >
                <span className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                  {isActive && (
                    <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${DOT_CLASSES[s.color]}`} />
                  )}
                </span>
                <span className={`text-[10px] font-medium truncate max-w-full ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
