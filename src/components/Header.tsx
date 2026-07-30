import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { isBookingAllowedEmail } from '@/utils/bookingAccess';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const canRequestReservation = isBookingAllowedEmail(session?.user?.email);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('token');
    await signOut({ redirect: false });
    router.push('/');
  };

  const navItems = [
    { href: '/', label: 'Inicio' },
    { href: '/como-funciona', label: '¿Cómo lo hacemos?' },
    { href: '/servicios', label: 'Servicios' },
    { href: '/partners', label: 'Partners' },
    { href: '/contacto', label: 'Contacto' },
    { href: '/mis-eventos', label: 'Mis Eventos' },
    ...(session?.user
      ? [(session.user as any).role === 'admin'
          ? { href: '/admin/dashboard', label: 'Panel admin' }
          : { href: '/area-privada', label: 'Área privada' }]
      : []),
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
                src="/happyhub_logo_cara.png"
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
                className={`text-sm text-gray-700 hover:text-primary-600 font-medium transition-colors px-3 h-9 flex items-center rounded-xl whitespace-nowrap hover:bg-primary-50 ${
                  router.pathname === item.href ? 'bg-primary-50 text-primary-600' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            {session?.user ? (
              <div className="flex items-center ml-2 space-x-2 bg-ocean-50 border border-ocean-200 rounded-xl px-3 py-1.5">
                <span className="text-sm font-medium text-ocean-700 max-w-[160px] truncate" title={session.user.email || ''}>
                  {session.user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-gray-700 hover:text-primary-600 transition-colors p-2 rounded-xl hover:bg-primary-50 ml-2"
                title="Iniciar sesión"
              >
                <User className="w-5 h-5" />
              </Link>
            )}
            {canRequestReservation ? (
              <Link
                href="/reservas"
                className="btn-primary ml-4 !py-2 !px-4 text-sm whitespace-nowrap"
              >
                Solicitar Reserva
              </Link>
            ) : (
              <span
                aria-disabled="true"
                title="Solicitar reserva no está disponible con esta cuenta."
                className="btn-primary ml-4 !py-2 !px-4 text-sm whitespace-nowrap opacity-50 cursor-not-allowed pointer-events-none"
              >
                Solicitar Reserva
              </span>
            )}
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
            {session?.user ? (
              <div className="flex items-center justify-between px-4 py-3 bg-ocean-50 border border-ocean-200 rounded-xl">
                <span className="text-sm font-medium text-ocean-700 truncate">
                  {session.user.email}
                </span>
                <button
                  onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                  className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Salir
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block text-gray-700 hover:text-primary-600 font-medium transition-colors px-4 py-3 rounded-xl hover:bg-primary-50"
              >
                Iniciar Sesión
              </Link>
            )}
            {canRequestReservation ? (
              <Link
                href="/reservas"
                onClick={() => setIsMenuOpen(false)}
                className="block btn-primary text-center mt-4"
              >
                Solicitar Reserva
              </Link>
            ) : (
              <span
                aria-disabled="true"
                title="Solicitar reserva no está disponible con esta cuenta."
                className="block btn-primary text-center mt-4 opacity-50 cursor-not-allowed"
              >
                Solicitar Reserva
              </span>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
