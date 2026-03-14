import Head from 'next/head';
import { useEffect } from 'react';
import Hero from '@/components/Hero';
import PhotoGallery from '@/components/PhotoGallery';
import PricingTable from '@/components/PricingTable';
import {
  Calendar, Users, Sparkles, Shield, Clock, Heart,
  ArrowRight, Cake, Palette, Camera, Music,
  Utensils, Gift, CheckCircle2, TrendingUp, Instagram
} from 'lucide-react';

export default function Home() {
  useEffect(() => {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = 'https://w.behold.so/widget.js';
    document.head.append(s);
    return () => { document.head.removeChild(s); };
  }, []);

  const features = [
    {
      icon: Calendar,
      title: 'Reserva en minutos',
      description: 'Sistema de reservas online 24/7 con confirmación instantánea y disponibilidad en tiempo real.',
    },
    {
      icon: Users,
      title: 'Hasta 50 personas',
      description: 'Espacio íntimo y acogedor, perfectamente equipado para celebraciones memorables.',
    },
    {
      icon: Sparkles,
      title: 'Todo incluido',
      description: 'Catering, decoración, animación y más. Personaliza cada aspecto de tu celebración.',
    },
    {
      icon: Shield,
      title: 'Pago 100% seguro',
      description: 'Múltiples métodos de pago con encriptación bancaria y garantía de protección total.',
    },
    {
      icon: Clock,
      title: 'Horarios flexibles',
      description: 'Elige la duración perfecta: desde 2 hasta 5 horas según tus necesidades.',
    },
    {
      icon: Heart,
      title: 'Atención personalizada',
      description: 'Equipo experto dedicado a hacer de tu evento una experiencia inolvidable.',
    },
  ];

  const eventTypes = [
    {
      title: 'Cumpleaños',
      icon: Cake,
      duration: '2-5 horas',
      description: 'Celebra tu día especial en un ambiente mágico y festivo',
      features: ['Decoración temática', 'Animación', 'Menú personalizado'],
    },
    {
      title: 'Celebraciones Familiares',
      icon: Heart,
      duration: '2-5 horas',
      description: 'El lugar perfecto para reuniones familiares especiales y momentos únicos',
      features: ['Ambiente acogedor', 'Catering adaptable', 'Espacio flexible'],
    },
    {
      title: 'Eventos con Amigos',
      icon: Users,
      duration: '2-5 horas',
      description: 'Reúne a tu grupo de amigos para celebrar cualquier ocasión especial',
      features: ['Ambiente divertido', 'Zona de juegos', 'DJ y música'],
    },
    {
      title: 'Colegio y Trabajo',
      icon: TrendingUp,
      duration: '2-5 horas',
      description: 'Espacio polivalente ideal para eventos de colegio, universidad o equipo de trabajo',
      features: ['Equipamiento A/V', 'Catering flexible', 'Configuración adaptable'],
    },
  ];

  const services = [
    {
      icon: Utensils,
      title: 'Catering Premium',
      description: 'Menús personalizados elaborados por chefs profesionales con ingredientes de primera calidad.',
      features: ['Menús infantiles', 'Opciones vegetarianas', 'Sin gluten/lactosa'],
    },
    {
      icon: Music,
      title: 'Animación y DJ',
      description: 'Animadores profesionales y DJs experimentados que harán bailar a todos tus invitados.',
      features: ['Animación infantil', 'DJ profesional', 'Karaoke'],
    },
    {
      icon: Palette,
      title: 'Decoración Mágica',
      description: 'Decoración temática personalizada que transforma el espacio según tus sueños.',
      features: ['Globos y guirnaldas', 'Centros de mesa', 'Photocall personalizado'],
    },
    {
      icon: Camera,
      title: 'Fotografía Profesional',
      description: 'Captura cada momento especial con nuestro servicio de fotografía y vídeo profesional.',
      features: ['Reportaje completo', 'Edición profesional', 'Álbum digital'],
    },
  ];

  const photos = [
    { src: '/happyhub_home.png', alt: 'Sala principal HappyHub', caption: 'Nuestra amplia sala principal, perfecta para cualquier celebración' },
    { src: '/happyhub_home.png', alt: 'Zona de juegos', caption: 'Zona de juegos infantiles totalmente equipada' },
    { src: '/happyhub_home.png', alt: 'Área de catering', caption: 'Área de catering con cocina totalmente equipada' },
    { src: '/happyhub_home.png', alt: 'Decoración de cumpleaños', caption: 'Ejemplo de decoración para cumpleaños' },
    { src: '/happyhub_home.png', alt: 'Terraza exterior', caption: 'Terraza exterior para los días soleados' },
  ];

  return (
    <>
      <Head>
        <title>HappyHub - Celebra Momentos Inolvidables | Alquiler de Espacios para Eventos</title>
        <meta
          name="description"
          content="El espacio perfecto para tus celebraciones. Organiza cumpleaños, comuniones, bautizos y eventos únicos con todo incluido. Reserva online en minutos."
        />
        <meta name="keywords" content="alquiler espacio eventos, cumpleaños, comuniones, bautizos, eventos Madrid, salón de celebraciones" />
      </Head>

      <Hero />

      {/* Photo Gallery Section */}
      <PhotoGallery photos={photos} title="Conoce Nuestro Espacio" />

      {/* Pricing Table Section */}
      <PricingTable />

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/30 to-transparent pointer-events-none"></div>

        <div className="container-custom relative z-10">
          <div className="text-center mb-16 animate-slide-up">
            <span className="section-tag">
              <Sparkles className="w-4 h-4 mr-2" />
              Por qué elegirnos
            </span>
            <h2 className="section-title">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="section-subtitle max-w-3xl mx-auto">
              Hacemos que organizar tu evento sea fácil, sin estrés y completamente memorable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-gradient-to-br from-primary-100 to-ocean-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-primary-700" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Event Types Section */}
      <section id="events" className="py-24 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="section-tag">
              <Gift className="w-4 h-4 mr-2" />
              Tipos de eventos
            </span>
            <h2 className="section-title">
              Celebraciones adaptadas a ti
            </h2>
            <p className="section-subtitle max-w-3xl mx-auto">
              Cada evento es único. Ofrecemos soluciones personalizadas para hacer realidad tu celebración perfecta
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {eventTypes.map((event, index) => (
              <div key={index} className="card text-center group">
                <div className="bg-gradient-to-br from-primary-100 to-ocean-100 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <event.icon className="w-10 h-10 text-primary-700" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{event.title}</h3>
                <p className="text-gray-600 mb-4">{event.description}</p>
                <div className="space-y-2 mb-6">
                  {event.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-primary-600 mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="text-sm text-gray-600">Duración: {event.duration}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="section-tag">
              <Sparkles className="w-4 h-4 mr-2" />
              Servicios incluidos
            </span>
            <h2 className="section-title">
              Todo lo necesario para tu evento perfecto
            </h2>
            <p className="section-subtitle max-w-3xl mx-auto">
              Servicios premium que transforman tu celebración en una experiencia extraordinaria
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="card group">
                <div className="flex items-start space-x-6">
                  <div className="bg-gradient-to-br from-primary-100 to-ocean-100 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <service.icon className="w-8 h-8 text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{service.description}</p>
                    <div className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-primary-600 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section id="instagram" className="py-24 bg-gradient-to-br from-primary-50 via-white to-ocean-50">
          <div className="container-custom">
          <div className="text-center mb-16">
            <span className="section-tag">
              <Instagram className="w-4 h-4 mr-2" />
              Instagram
            </span>
            <h2 className="section-title">
              Síguenos en Instagram
            </h2>
            <p className="section-subtitle max-w-3xl mx-auto">
              Descubre momentos reales de celebraciones en HappyHub
            </p>
          </div>

          <div data-behold-id="ijoWKINcQ9XXrzmDCvpI" />

          <div className="text-center mt-12">
            <a
              href="https://instagram.com/happyhub.es"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group inline-flex items-center"
            >
              <Instagram className="mr-2 w-5 h-5" />
              @happyhub.es
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-ocean-600 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container-custom text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              ¿Listo para celebrar?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              Reserva tu fecha ahora y prepárate para una experiencia inolvidable. Nuestro equipo está listo para hacer realidad la celebración de tus sueños.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/reservas"
                className="bg-white text-primary-700 px-10 py-5 rounded-2xl font-bold hover:bg-gray-100 transition-all text-lg inline-flex items-center justify-center hover:scale-105 shadow-xl"
              >
                Reservar ahora
                <ArrowRight className="ml-2 w-6 h-6" />
              </a>
            </div>
            <p className="text-white/80 mt-8 text-sm">
              Sin compromiso • Respuesta en menos de 24h • Pago 100% seguro
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
