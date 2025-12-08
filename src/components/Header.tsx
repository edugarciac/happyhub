import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Calendar, User } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Inicio' },
    { href: '/servicios', label: 'Servicios' },
    { href: '/disponibilidad', label: 'Disponibilidad' },
    { href: '/contacto', label: 'Contacto' },
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container-custom py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary-600 text-white p-2 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900">HappyHub</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/mi-reserva" className="text-gray-700 hover:text-primary-600 transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/reservas" className="btn-primary">
              Reservar ahora
            </Link>
          </div>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-gray-700 hover:text-primary-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/mi-reserva"
              className="block text-gray-700 hover:text-primary-600 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Mi Reserva
            </Link>
            <Link
              href="/reservas"
              className="block btn-primary text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Reservar ahora
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
