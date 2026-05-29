import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Users, CalendarDays, Gift, Bell, Mail, ImageIcon,
  MessageCircle, MessageSquare, CheckCircle2, ArrowRight, Sparkles
} from 'lucide-react';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session) {
    return { redirect: { destination: '/area-privada', permanent: false } };
  }
  return { props: {} };
};

const features = [
  { icon: Users, title: 'Gestión de invitados', desc: 'Lista, RSVP y estado de confirmación' },
  { icon: CalendarDays, title: 'Timeline de actividades', desc: 'Guion del evento minuto a minuto' },
  { icon: Gift, title: 'Coordinación de regalo', desc: 'Decidid y repartid el regalo en grupo' },
  { icon: Bell, title: 'Recordatorios automáticos', desc: 'Nadie se olvidará de nada' },
  { icon: Mail, title: 'Invitaciones digitales', desc: 'Comparte con un solo enlace' },
  { icon: ImageIcon, title: 'Galería de fotos', desc: 'Todas las fotos del evento en un álbum' },
  { icon: MessageCircle, title: 'Comentarios', desc: 'El grupo opina y recuerda' },
  { icon: MessageSquare, title: 'Soporte WhatsApp', desc: 'Notificaciones y gestión por WhatsApp' },
];

const timeline = [
  {
    phase: 'Antes',
    emoji: '📋',
    color: 'from-primary-100 to-primary-50',
    border: 'border-primary-200',
    titleColor: 'text-primary-700',
    items: ['Invitaciones digitales', 'Confirmación de asistencia', 'Coordinación de regalo', 'Recordatorios automáticos'],
  },
  {
    phase: 'Durante',
    emoji: '🎉',
    color: 'from-accent-100 to-accent-50',
    border: 'border-accent-200',
    titleColor: 'text-accent-700',
    items: ['Timeline del día', 'Actividades programadas', 'Gestión en tiempo real', 'Soporte WhatsApp'],
  },
  {
    phase: 'Después',
    emoji: '📸',
    color: 'from-ocean-100 to-ocean-50',
    border: 'border-ocean-200',
    titleColor: 'text-ocean-700',
    items: ['Galería de fotos', 'Comentarios de invitados', 'Valoraciones', 'Recuerdos compartidos'],
  },
];

const services = [
  { emoji: '🍽️', title: 'Catering', desc: 'Menús y bebidas para todos los gustos' },
  { emoji: '🎨', title: 'Decoración', desc: 'Transforma el espacio para tu ocasión' },
  { emoji: '🎉', title: 'Animación', desc: 'Actividades y entretenimiento para el grupo' },
];

export default function MisEventosPage() {
  return (
    <>
      <Head>
        <title>Mis Eventos – Organiza eventos colaborativos | HappyHub</title>
        <meta
          name="description"
          content="Crea eventos colaborativos con tu grupo. Gestiona invitados, timeline, regalo, fotos y más desde un solo lugar. Con soporte WhatsApp y servicios adicionales."
        />
      </Head>
      <Header />

      <main>
        {/* Hero */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black">
          <Image
            src="/images/Happyhub_eventos.png"
            alt="Evento en HappyHub"
            fill
            className="object-contain"
            priority
          />
          <div className="absolute inset-0 bg-black/55" />

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-2 bg-primary-500/80 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              Nuevo · Eventos colaborativos
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Organiza eventos increíbles.<br className="hidden sm:block" /> Juntos.
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Crea tu evento, invita a tu grupo y gestiona todo desde un solo lugar: invitados, actividades, regalo, fotos y mucho más.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login?redirect=/area-privada"
                className="bg-white text-primary-700 px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all text-lg inline-flex items-center justify-center hover:scale-105 shadow-xl"
              >
                Iniciar sesión para empezar
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/register"
                className="border-2 border-white/60 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-all text-lg inline-flex items-center justify-center"
              >
                ¿No tienes cuenta? Crear una gratis
              </Link>
            </div>
          </div>
        </section>

        {/* Timeline de fases */}
        <section className="py-24 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="section-title">De la idea al recuerdo</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                HappyHub te acompaña en cada etapa de tu evento
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {timeline.map((phase) => (
                <div
                  key={phase.phase}
                  className={`bg-gradient-to-br ${phase.color} border ${phase.border} rounded-2xl p-8`}
                >
                  <div className="text-4xl mb-4">{phase.emoji}</div>
                  <h3 className={`text-2xl font-bold mb-6 ${phase.titleColor}`}>{phase.phase}</h3>
                  <ul className="space-y-3">
                    {phase.items.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-gray-700">
                        <CheckCircle2 className="w-5 h-5 text-primary-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Grid de funcionalidades */}
        <section className="py-24 bg-white">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="section-title">Todo lo que necesitas en un solo lugar</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Herramientas pensadas para que organizar sea fácil y divertido
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map((f) => (
                <div key={f.title} className="card text-center group">
                  <div className="bg-gradient-to-br from-primary-100 to-ocean-100 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <f.icon className="w-7 h-7 text-primary-700" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">{f.title}</h3>
                  <p className="text-gray-500 text-xs md:text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Servicios adicionales */}
        <section className="py-24 bg-gradient-to-br from-primary-50 to-secondary-50">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="section-title">Personaliza cada detalle</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Añade servicios de HappyHub directamente desde tu evento
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {services.map((s) => (
                <div key={s.title} className="bg-white rounded-2xl shadow-md p-8 text-center hover:shadow-lg transition-shadow">
                  <div className="text-5xl mb-4">{s.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-gray-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-24 bg-gradient-to-br from-primary-600 via-ocean-600 to-accent-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="container-custom text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Listo para organizar tu evento perfecto?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Únete a HappyHub y empieza a crear experiencias inolvidables con tu grupo
            </p>
            <Link
              href="/login?redirect=/area-privada"
              className="bg-white text-primary-700 px-10 py-5 rounded-2xl font-bold hover:bg-gray-100 transition-all text-lg inline-flex items-center justify-center hover:scale-105 shadow-xl"
            >
              Empezar ahora
              <ArrowRight className="ml-2 w-6 h-6" />
            </Link>
            <p className="text-white/70 mt-6 text-sm">Registro gratuito · Sin tarjeta de crédito</p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
