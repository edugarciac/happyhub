import Head from 'next/head';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function Servicios() {
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
