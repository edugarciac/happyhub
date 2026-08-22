import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Star,
  Users,
  Calendar,
  Tag,
  Building2,
  Wrench,
  Briefcase,
  Euro,
  PartyPopper,
  MessageSquare,
  CalendarDays,
} from 'lucide-react';

interface DashboardNavProps {
  onNavigate?: () => void;
}

export default function DashboardNav({ onNavigate }: DashboardNavProps) {
  const router = useRouter();

  const menuItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/reviews', icon: Star, label: 'Reseñas' },
    { href: '/admin/clients', icon: Users, label: 'Usuarios' },
    { href: '/admin/reservations', icon: Calendar, label: 'Reservas' },
    { href: '/admin/event-types', icon: Tag, label: 'Tipos de Eventos' },
    { href: '/admin/actividades-catalogo', icon: PartyPopper, label: 'Catálogo de Actividades' },
    { href: '/admin/partners', icon: Building2, label: 'Partners' },
    { href: '/admin/reservation-services', icon: Wrench, label: 'Servicios Reservas' },
    { href: '/admin/services', icon: Briefcase, label: 'Servicios' },
    { href: '/admin/pricing', icon: Euro, label: 'Precios' },
    { href: '/admin/holidays', icon: CalendarDays, label: 'Festivos' },
    { href: '/admin/feedback', icon: MessageSquare, label: 'Feedback' },
  ];

  const isActive = (href: string) => {
    return router.pathname === href;
  };

  return (
    <nav className="space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              active
                ? 'bg-primary-100 text-primary-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
