import Head from 'next/head';
import Link from 'next/link';
import Hero from '@/components/Hero';
import { Calendar, Users, Sparkles, Shield, Clock, Heart } from 'lucide-react';

export default function Home() {
  const eventTypes = [
    {
      title: 'Cumpleaños',
      emoji: '🎂',
      duration: '2-5 horas',
      price: 'Desde €200',
      description: 'Celebra tu día especial con nosotros',
    },
    {
      title: 'Comuniones',
      emoji: '🕊️',
      duration: '3-5 horas',
      price: 'Desde €300',
      description: 'Un día inolvidable para toda la familia',
    },
    {
      title: 'Bautizos',
      emoji: '👶',
      duration: '2-4 horas',
      price: 'Desde €200',
      description: 'Comienza una nueva etapa con alegría',
    },
    {
      title: 'Otros eventos',
      emoji: '🎉',
      duration: '2-5 horas',
      price: 'Desde €200',
      description: 'Cualquier celebración que imagines',
    },
  ];

  const features = [
    {
      icon: Calendar,
      title: 'Reserva fácil',
      description: 'Sistema de reservas online 24/7. Comprueba disponibilidad en tiempo real.',
    },
    {
      icon: Users,
      title: 'Hasta 150 personas',
      description: 'Espacio amplio y versátil para celebraciones de cualquier tamaño.',
    },
    {
      icon: Sparkles,
      title: 'Todo incluido',
      description: 'Catering, decoración, animación y más. Personaliza tu evento.',
    },
    {
      icon: Shield,
      title: 'Pago seguro',
      description: 'Múltiples opciones de pago con garantía y protección total.',
    },
    {
      icon: Clock,
      title: 'Flexibilidad horaria',
      description: 'Elige la duración perfecta para tu evento, de 2 a 5 horas.',
    },
    {
      icon: Heart,
      title: 'Atención personalizada',
      description: 'Equipo dedicado para hacer tu celebración inolvidable.',
    },
  ];

  const testimonials = [
    {
      name: 'María García',
      event: 'Cumpleaños infantil',
      rating: 5,
      comment: 'Increíble experiencia. Los niños se lo pasaron genial y todo estaba perfectamente organizado.',
    },
    {
      name: 'Juan Martínez',
      event: 'Comunión',
      rating: 5,
      comment: 'Servicio impecable. El catering fue excelente y el espacio precioso. Totalmente recomendable.',
    },
    {
      name: 'Laura Sánchez',
      event: 'Bautizo',
      rating: 5,
      comment: 'Todo fue perfecto, desde la reserva hasta el último detalle. Muchas gracias por hacer nuestro día tan especial.',
    },
  ];

  const providers = ['Catering Premium', 'Animaciones Kids', 'Decoraciones Mágicas', 'Fotografía Pro'];

  return (
    <>
      <Head>
        <title>HappyHub - El Espacio Perfecto para tus Celebraciones</title>
        <meta name="description" content="Organiza cumpleaños, comuniones, bautizos y eventos únicos. Reserva online con todo incluido." />
      </Head>

      <Hero />

      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title">¿Por qué elegir HappyHub?</h2>
            <p className="section-subtitle">
              Hacemos que tu celebración sea perfecta sin estrés
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card">
                <feature.icon className="w-12 h-12 text-primary-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title">Tipos de eventos</h2>
            <p className="section-subtitle">
              Celebraciones adaptadas a tus necesidades
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {eventTypes.map((event, index) => (
              <div key={index} className="card text-center">
                <div className="text-6xl mb-4">{event.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-3">{event.description}</p>
                <div className="space-y-1 text-sm">
                  <div className="text-gray-600">Duración: {event.duration}</div>
                  <div className="text-primary-600 font-bold">{event.price}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/servicios" className="btn-primary">
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title">Lo que dicen nuestros clientes</h2>
            <p className="section-subtitle">
              Más de 500 eventos organizados con éxito
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">&quot;{testimonial.comment}&quot;</p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title">Nuestros proveedores de confianza</h2>
            <p className="section-subtitle">
              Trabajamos con los mejores profesionales
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8">
            {providers.map((provider, index) => (
              <div
                key={index}
                className="bg-white px-8 py-6 rounded-lg shadow-md text-center font-semibold text-gray-700"
              >
                {provider}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para celebrar?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Reserva tu fecha ahora y prepárate para una celebración inolvidable
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reservas" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg">
              Reservar ahora
            </Link>
            <Link href="/disponibilidad" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors text-lg">
              Ver disponibilidad
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
