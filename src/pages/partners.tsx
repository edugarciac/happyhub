import Head from 'next/head';
import Link from 'next/link';
import { UtensilsCrossed, Camera, Palette, Music, PartyPopper, Truck, Users, ExternalLink } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  catering: <UtensilsCrossed className="w-8 h-8" />,
  fotografia: <Camera className="w-8 h-8" />,
  decoracion: <Palette className="w-8 h-8" />,
  musica: <Music className="w-8 h-8" />,
  animacion: <PartyPopper className="w-8 h-8" />,
  transporte: <Truck className="w-8 h-8" />,
};

interface Partner {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  description: string;
  logo?: string;
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

export default function Partners() {
  return (
    <>
      <Head>
        <title>Partners - HappyHub</title>
        <meta
          name="description"
          content="Conoce las empresas que forman parte del hub de HappyHub. Profesionales de catering, fotografia, decoracion, animacion y mas para hacer tu evento perfecto."
        />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 pt-28 pb-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nuestros Partners
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            HappyHub es un hub de empresas que colaboran para hacer tus eventos inolvidables.
            Cada partner ha sido seleccionado por su profesionalidad, calidad y compromiso.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="section-title text-center mb-12">Empresas colaboradoras</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className={`card relative ${partner.featured ? 'ring-2 ring-primary-200' : ''}`}
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

      <section className="py-16 bg-gray-50">
        <div className="container-custom text-center">
          <div className="max-w-2xl mx-auto">
            <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="section-title mb-4">Unete al hub</h2>
            <p className="text-xl text-gray-600 mb-4">
              Eres una empresa de servicios para eventos y quieres formar parte de HappyHub?
              Estamos buscando profesionales comprometidos con la calidad.
            </p>
            <p className="text-gray-500 mb-8">
              Como partner tendras visibilidad ante nuestros clientes, acceso a reservas y un canal
              directo de comunicacion para coordinar cada evento.
            </p>
            <Link href="/contacto" className="btn-primary">
              Contacta con nosotros
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
