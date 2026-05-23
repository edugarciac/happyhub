import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Hero from '@/components/Hero';
import PhotoGallery from '@/components/PhotoGallery';
import PricingTable from '@/components/PricingTable';
import { fetchInstagramPosts, InstagramPost } from '@/lib/instagram';
import {
  Calendar, Users, Sparkles, Shield, Clock, Heart,
  ArrowRight, Gift, CheckCircle2, Instagram, Star
} from 'lucide-react';

interface Review {
  id: number;
  title: string;
  rating: number;
  review_text?: string;
  customer_name: string;
  created_at: string;
}

interface HomeProps {
  instagramPosts: InstagramPost[];
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const instagramPosts = await fetchInstagramPosts(9);
  return {
    props: { instagramPosts },
    revalidate: 3600, // Re-fetch every hour
  };
};

interface EventType {
  id: number;
  name: string;
  description: string;
  icon: string;
  features: string[];
}

export default function Home({ instagramPosts }: HomeProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  useEffect(() => {
    fetch('/api/reviews?limit=6')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setReviews(data.reviews || []);
          setReviewsTotal(data.total || 0);
        }
      })
      .catch(() => {});

    fetch('/api/event-types')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.success) {
          setEventTypes(data.eventTypes.map((t: any) => ({
            ...t,
            features: typeof t.features === 'string' ? JSON.parse(t.features) : (t.features || []),
          })));
        }
      })
      .catch(() => {});
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
      title: 'Servicios adicionales',
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

  const photos = [
    { src: '/images/gallery/gallery-1.jpg', alt: 'Brindis entre amigos', caption: 'Celebra con los tuyos en un ambiente único' },
    { src: '/images/gallery/gallery-2.jpg', alt: 'Cumpleaños en HappyHub', caption: 'Fiestas de cumpleaños con todos los detalles' },
    { src: '/images/gallery/gallery-3.jpg', alt: 'Fiesta nocturna', caption: 'Sesiones nocturnas con luces y sonido profesional' },
    { src: '/images/gallery/gallery-4.jpg', alt: 'Decoración con globos', caption: 'Decoramos tu evento para hacerlo especial' },
    { src: '/images/gallery/gallery-5.jpg', alt: 'Globos de colores', caption: 'Cada celebración es única en HappyHub' },
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
      {eventTypes.length > 0 && (
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

            <div className={`grid grid-cols-1 md:grid-cols-2 ${eventTypes.length >= 4 ? 'lg:grid-cols-4' : eventTypes.length === 3 ? 'lg:grid-cols-3' : ''} gap-8`}>
              {eventTypes.map((event) => (
                <div key={event.id} className="card text-center group">
                  {event.icon && (
                    <div className="text-5xl mb-6">{event.icon}</div>
                  )}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{event.name}</h3>
                  {event.description && (
                    <p className="text-gray-600 mb-4">{event.description}</p>
                  )}
                  {event.features.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {event.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-primary-600 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Instagram Feed Section */}
      <section id="instagram" className="py-24 bg-gradient-to-br from-primary-50 via-white to-ocean-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="section-tag">
              <Instagram className="w-4 h-4 mr-2" />
              Instagram
            </span>
            <h2 className="section-title">
              Siguenos en Instagram
            </h2>
            <p className="section-subtitle max-w-3xl mx-auto">
              Descubre momentos reales de celebraciones en Happyhub
            </p>
          </div>

          {instagramPosts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {instagramPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-xl overflow-hidden group"
                >
                  <Image
                    src={post.thumbnail_url || post.media_url}
                    alt={post.caption?.slice(0, 100) || 'Happyhub en Instagram'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Instagram className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Instagram className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Proximamente: nuestro feed de Instagram</p>
            </div>
          )}

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

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="text-center mb-16">
              <span className="section-tag">
                <Star className="w-4 h-4 mr-2" />
                Reseñas
              </span>
              <h2 className="section-title">Lo que dicen nuestros clientes</h2>
              <p className="section-subtitle max-w-3xl mx-auto">
                Opiniones reales de personas que celebraron con nosotros
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="card flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-5 h-5"
                        style={{
                          fill: review.rating >= star ? '#f59e0b' : 'none',
                          color: review.rating >= star ? '#f59e0b' : '#d1d5db',
                        }}
                      />
                    ))}
                  </div>
                  {/* Title */}
                  <h3 className="font-bold text-gray-900 mb-2">{review.title}</h3>
                  {/* Review text */}
                  {review.review_text && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 flex-1 mb-4">
                      {review.review_text}
                    </p>
                  )}
                  {/* Footer */}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{review.customer_name}</span>
                    <span>
                      {new Date(review.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {reviewsTotal > 6 && (
              <div className="text-center mt-10">
                <a
                  href="/resenas"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-primary-600 text-primary-600 rounded-xl font-medium hover:bg-primary-50 transition"
                >
                  Ver todas las reseñas
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </section>
      )}

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
