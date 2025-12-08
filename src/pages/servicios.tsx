import Head from 'next/head';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function Servicios() {
  const services = [
    {
      id: 'catering',
      name: 'Catering',
      price: '€15 por persona',
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
      price: '€150 fijo',
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
      price: '€100 fijo',
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
      price: '€200 fijo',
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
      price: '€50 fijo',
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

  const packs = [
    {
      name: 'Pack Básico',
      price: 300,
      duration: '3 horas',
      included: ['Espacio', 'Limpieza'],
      recommended: false,
    },
    {
      name: 'Pack Completo',
      price: 650,
      duration: '4 horas',
      included: ['Espacio', 'Catering (50 pax)', 'Decoración', 'Limpieza'],
      recommended: true,
    },
    {
      name: 'Pack Premium',
      price: 1000,
      duration: '5 horas',
      included: ['Espacio', 'Catering (50 pax)', 'Decoración', 'Animación', 'Fotografía', 'Tarta', 'Limpieza'],
      recommended: false,
    },
  ];

  return (
    <>
      <Head>
        <title>Servicios - HappyHub</title>
        <meta name="description" content="Servicios y extras para tu celebración. Catering, animación, decoración, fotografía y más." />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nuestros Servicios
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Todo lo que necesitas para hacer tu evento inolvidable. Elige los servicios que mejor se adapten a tus necesidades.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="section-title text-center mb-12">Packs recomendados</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {packs.map((pack, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-8 ${
                  pack.recommended
                    ? 'bg-primary-600 text-white shadow-2xl transform scale-105'
                    : 'bg-white border-2 border-gray-200'
                }`}
              >
                {pack.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-secondary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Más popular
                  </div>
                )}

                <h3
                  className={`text-2xl font-bold mb-2 ${
                    pack.recommended ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {pack.name}
                </h3>
                <div
                  className={`text-4xl font-bold mb-4 ${
                    pack.recommended ? 'text-white' : 'text-primary-600'
                  }`}
                >
                  €{pack.price}
                </div>
                <p
                  className={`mb-6 ${
                    pack.recommended ? 'text-primary-100' : 'text-gray-600'
                  }`}
                >
                  {pack.duration}
                </p>

                <ul className="space-y-3 mb-8">
                  {pack.included.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <Check
                        className={`w-5 h-5 mr-2 flex-shrink-0 ${
                          pack.recommended ? 'text-white' : 'text-primary-600'
                        }`}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/reservas"
                  className={`block text-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                    pack.recommended
                      ? 'bg-white text-primary-600 hover:bg-gray-100'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  Reservar este pack
                </Link>
              </div>
            ))}
          </div>

          <h2 className="section-title text-center mb-12">Servicios individuales</h2>

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

      <section className="py-16 bg-gray-50">
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
