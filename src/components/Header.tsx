import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, User } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setIsMenuOpen(false);
    }
  };

  const navItems = [
    { id: 'features', label: 'Características' },
    { id: 'events', label: 'Eventos' },
    { id: 'services', label: 'Servicios' },
    { id: 'testimonials', label: 'Opiniones' },
    { id: 'contact', label: 'Contacto' },
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
          <button
            onClick={() => scrollToSection('hero')}
            className="flex items-center space-x-3 group"
          >
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white p-1">
              <Image
                src="/logo-happyhub-black.jpeg"
                alt="HappyHub Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-ocean-700 bg-clip-text text-transparent">
              HappyHub
            </span>
          </button>

          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors px-4 py-2 rounded-xl hover:bg-primary-50"
              >
                {item.label}
              </button>
            ))}
            <a
              href="/mi-reserva"
              className="text-gray-700 hover:text-primary-600 transition-colors p-2 rounded-xl hover:bg-primary-50 ml-2"
            >
              <User className="w-5 h-5" />
            </a>
            <a
              href="/reservas"
              className="btn-primary ml-4 !py-2.5 !px-6 text-sm"
            >
              Reservar ahora
            </a>
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
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="block w-full text-left text-gray-700 hover:text-primary-600 font-medium transition-colors px-4 py-3 rounded-xl hover:bg-primary-50"
              >
                {item.label}
              </button>
            ))}
            <a
              href="/mi-reserva"
              className="block text-gray-700 hover:text-primary-600 font-medium transition-colors px-4 py-3 rounded-xl hover:bg-primary-50"
            >
              Mi Reserva
            </a>
            <a
              href="/reservas"
              className="block btn-primary text-center mt-4"
            >
              Reservar ahora
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}
