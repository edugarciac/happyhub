import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">HappyHub</h3>
            <p className="text-gray-400 mb-4">
              El espacio perfecto para tus celebraciones. Creamos momentos inolvidables.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="text-gray-400 hover:text-white transition-colors">
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="/disponibilidad" className="text-gray-400 hover:text-white transition-colors">
                  Disponibilidad
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-gray-400 hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/politica-privacidad" className="text-gray-400 hover:text-white transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-gray-400 hover:text-white transition-colors">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/politica-cancelacion" className="text-gray-400 hover:text-white transition-colors">
                  Política de cancelación
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-1" />
                <span className="text-gray-400">Calle Ejemplo 123, 28001 Madrid</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <a href="tel:+34900123456" className="text-gray-400 hover:text-white transition-colors">
                  +34 900 123 456
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <a href="mailto:info@happyhub.es" className="text-gray-400 hover:text-white transition-colors">
                  info@happyhub.es
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} HappyHub. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
