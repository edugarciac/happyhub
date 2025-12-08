import Image from 'next/image';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <footer id="contact" className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-ocean-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container-custom py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white p-1">
                <Image
                  src="/src/logo/logo-happyhub-black.jpeg"
                  alt="HappyHub Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-bold">HappyHub</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              El espacio perfecto donde tus celebraciones cobran vida. Creamos momentos inolvidables con pasión y dedicación.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-primary-600 text-white p-3 rounded-xl transition-all hover:scale-110"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-primary-600 text-white p-3 rounded-xl transition-all hover:scale-110"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-primary-600 text-white p-3 rounded-xl transition-all hover:scale-110"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Navegación</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection('hero')}
                  className="text-gray-400 hover:text-primary-400 transition-colors flex items-center group"
                >
                  <span className="mr-2 group-hover:mr-3 transition-all">→</span>
                  Inicio
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-gray-400 hover:text-primary-400 transition-colors flex items-center group"
                >
                  <span className="mr-2 group-hover:mr-3 transition-all">→</span>
                  Características
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('services')}
                  className="text-gray-400 hover:text-primary-400 transition-colors flex items-center group"
                >
                  <span className="mr-2 group-hover:mr-3 transition-all">→</span>
                  Servicios
                </button>
              </li>
              <li>
                <a
                  href="/disponibilidad"
                  className="text-gray-400 hover:text-primary-400 transition-colors flex items-center group"
                >
                  <span className="mr-2 group-hover:mr-3 transition-all">→</span>
                  Disponibilidad
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Legal</h4>
            <ul className="space-y-3">
              <li>
                <a href="/politica-privacidad" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Política de privacidad
                </a>
              </li>
              <li>
                <a href="/terminos" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Términos y condiciones
                </a>
              </li>
              <li>
                <a href="/politica-cancelacion" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Política de cancelación
                </a>
              </li>
              <li>
                <a href="/faq" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Preguntas frecuentes
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 group">
                <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                <span className="text-gray-400">Calle Ejemplo 123, 28001 Madrid, España</span>
              </li>
              <li className="flex items-center space-x-3 group">
                <Phone className="w-5 h-5 text-primary-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a href="tel:+34900123456" className="text-gray-400 hover:text-primary-400 transition-colors">
                  +34 900 123 456
                </a>
              </li>
              <li className="flex items-center space-x-3 group">
                <Mail className="w-5 h-5 text-primary-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a href="mailto:info@happyhub.es" className="text-gray-400 hover:text-primary-400 transition-colors">
                  info@happyhub.es
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700/50 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm flex items-center">
              &copy; {new Date().getFullYear()} HappyHub. Todos los derechos reservados.
              <Heart className="w-4 h-4 ml-2 text-red-500 fill-current" />
            </p>
            <p className="text-gray-500 text-sm">
              Hecho con pasión en Madrid
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
