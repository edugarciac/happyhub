import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  showStats?: boolean;
}

export default function Hero({
  title = 'El Espacio Perfecto para tus Celebraciones',
  subtitle = 'Organiza cumpleaños, comuniones, bautizos y eventos únicos con todo incluido. Reserva en minutos y nosotros nos encargamos del resto.',
  ctaText = 'Reservar ahora',
  ctaLink = '/reservas',
  showStats = true,
}: HeroProps) {
  return (
    <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-semibold">Valoración 4.9/5 por nuestros clientes</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {title}
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-8">{subtitle}</p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={ctaLink} className="btn-primary inline-flex items-center justify-center">
                {ctaText}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/disponibilidad" className="btn-outline inline-flex items-center justify-center">
                Ver disponibilidad
              </Link>
            </div>

            {showStats && (
              <div className="grid grid-cols-3 gap-6 mt-12">
                <div>
                  <div className="text-3xl font-bold text-primary-600">500+</div>
                  <div className="text-sm text-gray-600">Eventos realizados</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-600">4.9/5</div>
                  <div className="text-sm text-gray-600">Valoración media</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-600">150</div>
                  <div className="text-sm text-gray-600">Capacidad máxima</div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 shadow-2xl transform rotate-3 transition-transform hover:rotate-6">
              <div className="absolute inset-0 flex items-center justify-center text-white text-center p-8">
                <div>
                  <div className="text-6xl font-bold mb-4">🎉</div>
                  <p className="text-xl font-semibold">Espacio de eventos</p>
                  <p className="text-sm opacity-90 mt-2">Cumpleaños • Comuniones • Bautizos</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 text-green-600 p-3 rounded-full">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Disponible</div>
                  <div className="text-sm text-gray-600">Reserva fácil</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
