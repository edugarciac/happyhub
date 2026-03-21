import Head from 'next/head';
import Link from 'next/link';
import { Check, UtensilsCrossed, Camera, Palette, Music, PartyPopper, Users, ExternalLink } from 'lucide-react';

const services = [
  {
    id: 'catering',
    name: 'Catering',
    price: 'Precio a consultar',
    description: 'Menú completo adaptado a tus preferencias',
    features: [
      'Entrantes variados',
      'Plato principal a elegir',
      'Postres caseros',
      'Bebidas incluidas',
      'Opciones vegetarianas y veganas',
      'Adaptación a alergias',
    ],
  },
  {
    id: 'animacion',
    name: 'Animación',
    price: 'Precio a consultar',
    description: 'Entretenimiento profesional para todas las edades',
    features: [
      'Animadores profesionales',
      'Juegos y actividades',
      'Música y baile',
      '2 horas de animación',
      'Material incluido',
      'Espectáculo final',
    ],
  },
  {
    id: 'decoracion',
    name: 'Decoración',
    price: 'Precio a consultar',
    description: 'Ambientación temática personalizada',
    features: [
      'Globos y guirnaldas',
      'Centros de mesa',
      'Photocall personalizado',
      'Iluminación especial',
      'Vajilla decorativa',
      'Montaje y desmontaje',
    ],
  },
  {
    id: 'fotografia',
    name: 'Fotografía',
    price: 'Precio a consultar',
    description: 'Reportaje fotográfico profesional',
    features: [
      'Fotógrafo profesional',
      '3 horas de cobertura',
      '200+ fotos editadas',
      'Entrega digital en 7 días',
      'Fotos en alta resolución',
      'Álbum online compartible',
    ],
  },
  {
    id: 'tarta',
    name: 'Tarta Personalizada',
    price: 'Precio a consultar',
    description: 'Tarta artesanal hecha a medida',
    features: [
      'Diseño personalizado',
      'Hasta 20 porciones',
      'Ingredientes premium',
      'Sabores a elegir',
      'Sin gluten disponible',
      'Entrega y montaje',
    ],
  },
];

const categoryIcons: Record<string, React.ReactNode> = {
  catering: <UtensilsCrossed className="w-8 h-8" />,
  fotografia: <Camera className="w-8 h-8" />,
  decoracion: <Palette className="w-8 h-8" />,
  musica: <Music className="w-8 h-8" />,
  animacion: <PartyPopper className="w-8 h-8" />,
};

interface Partner {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  description: string;
  website?: string;
  featured?: boolean;
}

const partners: Partner[] = [
  {
    id: 'catering-delicias',
    name: 'Delicias Catering',
    category: 'catering',
    categoryLabel: 'Catering',
    description: 'Cocina creativa para eventos. Menus personalizados con ingredientes de proximidad y opciones para todas las dietas.',
    featured: true,
  },
  {
    id: 'foto-momentos',
    name: 'Momentos Fotografia',
    category: 'fotografia',
    categoryLabel: 'Fotografia',
    description: 'Reportajes fotograficos naturales y espontaneos. Captamos la esencia de cada celebracion.',
  },
  {
    id: 'deco-fiesta',
    name: 'DecoFiesta',
    category: 'decoracion',
    categoryLabel: 'Decoracion',
    description: 'Ambientacion tematica y personalizada. Desde globos hasta montajes completos para cualquier tipo de evento.',
  },
  {
    id: 'animacion-risas',
    name: 'Risas y Juegos',
    category: 'animacion',
    categoryLabel: 'Animacion',
    description: 'Animadores profesionales para todas las edades. Juegos, talleres, espectaculos y mucha diversion.',
    featured: true,
  },
  {
    id: 'musica-viva',
    name: 'Musica Viva',
    category: 'musica',
    categoryLabel: 'Musica',
    description: 'DJs y grupos en vivo para tu evento. Pop, jazz, electronica o lo que necesites para ambientar tu fiesta.',
  },
];

export default function Servicios() {
  return (
    <>
      <Head>
        <title>Servicios - Happyhub</title>
        <meta name="description" content="Servicios y extras para tu celebración. Catering, animación, decoración, fotografía y más." />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 pt-28 pb-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nuestros Servicios
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Todo lo que necesitas para hacer tu evento inolvidable. Elige los servicios que mejor se adapten a tus necesidades.
          </p>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="section-title text-center mb-12">Servicios disponibles</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div key={service.id} className="card">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.name}</h3>
                <div className="text-primary-600 font-bold text-xl mb-3">{service.price}</div>
                <p className="text-gray-600 mb-6">{service.description}</p>

                <ul className="space-y-2">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="w-4 h-4 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center mb-4">Nuestros Partners</h2>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-12">
            Happyhub colabora con profesionales seleccionados por su calidad y compromiso para ofrecerte el mejor servicio.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative ${partner.featured ? 'ring-2 ring-primary-200' : ''}`}
              >
                {partner.featured && (
                  <span className="absolute top-4 right-4 bg-primary-100 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    Destacado
                  </span>
                )}

                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                    {categoryIcons[partner.category] || <Users className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{partner.name}</h3>
                    <span className="text-sm text-primary-600 font-medium">
                      {partner.categoryLabel}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{partner.description}</p>

                {partner.website && (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Visitar web
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="container-custom text-center">
          <h2 className="section-title mb-4">¿Necesitas algo personalizado?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Podemos adaptar nuestros servicios a tus necesidades específicas. Contáctanos para un presupuesto a medida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reservas" className="btn-primary">
              Hacer una reserva
            </Link>
            <Link href="/contacto" className="btn-outline">
              Contactar
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
