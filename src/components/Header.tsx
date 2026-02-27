import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Menu, X, User } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: 'Inicio' },
    { href: '/como-funciona', label: 'Cómo Funciona' },
    { href: '/servicios', label: 'Servicios' },
    { href: '/disponibilidad', label: 'Disponibilidad' },
    { href: '/contacto', label: 'Contacto' },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-lg shadow-lg'
          : 'bg-white/50 backdrop-blur-sm'
      }`}
    >
      <nav className="container-custom py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10">
              <Image
                src="/logo-happyhub-white-small.jpeg"
                alt="HappyHub Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-[#FF6B35]">Happy</span>
              <span className="text-[#00BCD4]">Hub</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-gray-700 hover:text-primary-600 font-medium transition-colors px-4 py-2 rounded-xl hover:bg-primary-50 ${
                  router.pathname === item.href ? 'bg-primary-50 text-primary-600' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-gray-700 hover:text-primary-600 transition-colors p-2 rounded-xl hover:bg-primary-50 ml-2"
              title="Iniciar sesión"
            >
              <User className="w-5 h-5" />
            </Link>
            <Link
              href="/reservas"
              className="btn-primary ml-4 !py-2.5 !px-6 text-sm"
            >
              Solicitar Reserva
            </Link>
          </div>

          <button
            className="lg:hidden text-gray-700 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden mt-6 pb-4 space-y-2 animate-fade-in">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block w-full text-left text-gray-700 hover:text-primary-600 font-medium transition-colors px-4 py-3 rounded-xl hover:bg-primary-50 ${
                  router.pathname === item.href ? 'bg-primary-50 text-primary-600' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="block text-gray-700 hover:text-primary-600 font-medium transition-colors px-4 py-3 rounded-xl hover:bg-primary-50"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/reservas"
              onClick={() => setIsMenuOpen(false)}
              className="block btn-primary text-center mt-4"
            >
              Solicitar Reserva
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
