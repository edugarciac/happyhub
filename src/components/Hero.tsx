import { ArrowRight, Star, Sparkles, ChevronDown } from 'lucide-react';

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  showStats?: boolean;
}

export default function Hero({
  title = 'Celebra Momentos Inolvidables',
  subtitle = 'Transforma tus eventos en experiencias mágicas. El espacio perfecto donde cada detalle cobra vida y los recuerdos se vuelven eternos.',
  ctaText = 'Reserva tu fecha',
  showStats = true,
}: HeroProps) {
  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 bg-gradient-to-br from-primary-50 via-white to-ocean-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-ocean-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column - Content */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-100 to-ocean-100 text-primary-700 px-5 py-2.5 rounded-full mb-8 shadow-sm">
              <Star className="w-4 h-4 fill-current animate-pulse" />
              <span className="text-sm font-semibold">4.9/5 - Más de 500 eventos exitosos</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-[1.1]">
              {title}
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-xl">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <a
                href="/reservas"
                className="btn-primary group"
              >
                {ctaText}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/disponibilidad"
                className="btn-outline group"
              >
                Ver disponibilidad
                <Sparkles className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
              </a>
            </div>

            {showStats && (
              <div className="grid grid-cols-3 gap-8">
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-ocean-600 bg-clip-text text-transparent">500+</div>
                  <div className="text-sm text-gray-600 mt-2 font-medium">Eventos realizados</div>
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-ocean-600 bg-clip-text text-transparent">4.9</div>
                  <div className="text-sm text-gray-600 mt-2 font-medium">Valoración media</div>
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-ocean-600 bg-clip-text text-transparent">50</div>
                  <div className="text-sm text-gray-600 mt-2 font-medium">Capacidad máxima</div>
                </div>
              </div>
            )}
          </div>

          {/* Right column - Hero Video */}
          <div className="relative animate-scale-in">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              {/* Video background */}
              <div className="aspect-[4/5] relative bg-black">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="/hero-celebration.mp4" type="video/mp4" />
                  {/* Fallback si no hay video */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-ocean-400 to-accent-400 flex items-center justify-center text-white">
                    <div className="text-center p-8">
                      <div className="text-7xl mb-6 animate-float">🎉</div>
                      <p className="text-3xl font-bold mb-3">Tu Espacio Ideal</p>
                      <p className="text-lg opacity-90">Cumpleaños • Comuniones • Bautizos</p>
                    </div>
                  </div>
                </video>

                {/* Gradient overlay for better readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>

                {/* Optional overlay text */}
                <div className="absolute bottom-8 left-8 right-8 text-white z-10">
                  <p className="text-2xl font-bold mb-2 drop-shadow-lg">Experiencias Inolvidables</p>
                  <p className="text-sm opacity-90 drop-shadow-md">Donde cada celebración se convierte en un recuerdo mágico</p>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute top-6 right-6 bg-white p-5 rounded-2xl shadow-2xl animate-float backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white p-3 rounded-xl">
                    <Star className="w-7 h-7 fill-current" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">Disponible ya</div>
                    <div className="text-sm text-gray-600">Reserva fácil y rápida</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary-300/50 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-ocean-300/50 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToFeatures}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 hover:text-primary-600 transition-colors animate-bounce cursor-pointer"
        aria-label="Scroll to features"
      >
        <ChevronDown className="w-8 h-8" />
      </button>
    </section>
  );
}
